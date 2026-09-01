import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { AlertChannel, AlertSendStatus } from "@/generated/prisma/enums";
import type { AlertChannelPreference, EscortPosition } from "@/generated/prisma/enums";
import { sendEmail } from "@/lib/resend";
import { sendSms } from "@/lib/twilio";
import { normalizePhoneToE164 } from "@/lib/phone";
import { loadMatchEmail, loadMatchSmsBody } from "@/lib/email-templates";

// A row is claimed (inserted) then retried at most once, so the highest
// legitimate attempts value is 2 (initial + one retry). A row is
// "permanently failed" -- worth surfacing to admins -- once it's stuck at
// status=failed with attempts >= MAX_ATTEMPTS; see the admin failed-alerts
// page, which imports this rather than hardcoding 2 a second time.
export const MAX_ATTEMPTS = 2;

type MatchRow = {
  search_location_id: string;
  search_location_label: string | null;
  search_location_city: string;
  search_location_state: string;
  pilot_email: string;
  pilot_phone: string;
  alert_channel: AlertChannelPreference;
  distance_miles: number;
};

type LoadForAlert = {
  id: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  escortPositions: EscortPosition[];
  postedByPhone: string;
  alertCycle: number;
};

type PendingRetry = {
  alertId: string;
  match: MatchRow;
  channel: AlertChannel;
};

// Runs the same radius+escort-position match as browse, but against every
// active SearchLocation on a trialing (not expired)/active PilotCarProfile,
// with no dedup across a profile's own locations -- see PHASE1_PLAN.md Week
// 2 Day 4. Called on load create and on edits that change origin or escort
// positions (see the loads API routes). Each location's own alertChannel
// preference (Week 2 Day 5) decides which of email/sms actually get
// attempted; active=false mutes/pauses a location entirely (no attempt on
// either channel), same as it always has since Week 1.
//
// Each match's send is attempted once inline (so the initial fan-out stays
// "real-time" per the plan), and any failures get exactly one retry pass
// scheduled via after() once this function returns -- see retryFailedAlerts.
export async function matchAndAlertLoad(loadId: string): Promise<void> {
  const load = await prisma.load.findUnique({
    where: { id: loadId },
    include: { postedBy: { select: { phone: true } } },
  });
  if (!load || load.status !== "open") return;
  const alertLoad: LoadForAlert = { ...load, postedByPhone: load.postedBy.phone };

  const matches = await prisma.$queryRaw<MatchRow[]>`
    SELECT sl.id as search_location_id, sl.label as search_location_label,
      sl.city as search_location_city, sl.state as search_location_state,
      u.email as pilot_email, pcp.phone as pilot_phone,
      sl.alert_channel,
      (3959 * acos(least(1, greatest(-1,
        cos(radians(sl.lat)) * cos(radians(${load.originLat})) * cos(radians(${load.originLng}) - radians(sl.lng))
        + sin(radians(sl.lat)) * sin(radians(${load.originLat}))
      )))) as distance_miles
    FROM search_locations sl
    JOIN pilot_car_profiles pcp ON pcp.id = sl.profile_id
    JOIN users u ON u.id = pcp.user_id
    WHERE sl.active = true
      AND sl.lat IS NOT NULL AND sl.lng IS NOT NULL
      AND sl.escort_positions && ${load.escortPositions}::"EscortPosition"[]
      AND (
        pcp.subscription_status = 'active'
        OR (pcp.subscription_status = 'trialing' AND pcp.trial_ends_at > now())
      )
      AND (3959 * acos(least(1, greatest(-1,
            cos(radians(sl.lat)) * cos(radians(${load.originLat})) * cos(radians(${load.originLng}) - radians(sl.lng))
            + sin(radians(sl.lat)) * sin(radians(${load.originLat}))
          )))) <= sl.radius_miles
  `;

  const toRetry: PendingRetry[] = [];

  for (const match of matches) {
    const wantedChannels = channelsFor(match.alert_channel);
    for (const channel of wantedChannels) {
      const result = await attemptAlert(loadId, match, alertLoad, channel);
      if (result?.failed) {
        toRetry.push({ alertId: result.id, match, channel });
      }
    }
  }

  if (toRetry.length > 0) {
    // The initial attempt already satisfied "real-time" -- the retry is
    // best-effort cleanup, so it doesn't need to block the response. Using
    // after() (not a bare unawaited call) matters specifically because this
    // app runs on Vercel serverless: function execution isn't guaranteed to
    // continue once the response is sent otherwise, so an un-awaited retry
    // could silently never run in production while looking fine locally.
    after(() => retryFailedAlerts(toRetry, alertLoad));
  }
}

// A location set to "email" or "sms" only never gets an attemptAlert call
// for the other channel at all -- no LoadAlert row is created for it,
// consistent with how a paused (active=false) location gets no rows on
// either channel.
function channelsFor(preference: AlertChannelPreference): AlertChannel[] {
  if (preference === "email") return [AlertChannel.email];
  if (preference === "sms") return [AlertChannel.sms];
  return [AlertChannel.email, AlertChannel.sms];
}

// Inserts the LoadAlert row first (claiming the (load, location, channel,
// alertCycle) slot via the unique constraint) before attempting the send,
// so a concurrent re-trigger of matching can never double-send. Returns
// null if the slot was already claimed by an earlier trigger (nothing to
// do here). Stamping load.alertCycle here (rather than defaulting) is what
// lets a reopened load claim a fresh slot without colliding with the prior
// cycle's row -- see Load.alertCycle.
async function attemptAlert(
  loadId: string,
  match: MatchRow,
  load: LoadForAlert,
  channel: AlertChannel
): Promise<{ id: string; failed: boolean } | null> {
  let alert;
  try {
    alert = await prisma.loadAlert.create({
      data: {
        loadId,
        searchLocationId: match.search_location_id,
        channel,
        attempts: 1,
        alertCycle: load.alertCycle,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return null;
    }
    throw e;
  }

  const succeeded = await performSend(channel, match, load);
  if (succeeded) {
    await prisma.loadAlert.update({
      where: { id: alert.id },
      data: { status: AlertSendStatus.sent },
    });
    return { id: alert.id, failed: false };
  }
  return { id: alert.id, failed: true };
}

async function performSend(
  channel: AlertChannel,
  match: MatchRow,
  load: LoadForAlert
): Promise<boolean> {
  // No searchLocationId on this link (dropped along with the long
  // /dashboard/pilot-car?loadId=...&searchLocationId=... form) -- the
  // distance/label it used to feed the landing page's cosmetic "X mi away"
  // badge is now stated directly in the alert body instead (see
  // locationLabel below), so the query param was pure redundancy once that
  // text existed. loadId alone still fully identifies the load; see
  // GET /api/loads/[id].
  const loadUrl = `${process.env.APP_BASE_URL}/l/${load.id}`;
  const locationLabel =
    match.search_location_label || `${match.search_location_city}, ${match.search_location_state}`;
  const posterPhone = normalizePhoneToE164(load.postedByPhone);
  try {
    if (channel === AlertChannel.email) {
      const { subject, html } = loadMatchEmail({
        originCity: load.originCity,
        originState: load.originState,
        destinationCity: load.destinationCity,
        destinationState: load.destinationState,
        escortPositions: load.escortPositions,
        distanceMiles: match.distance_miles,
        locationLabel,
        loadUrl,
        posterPhone,
      });
      await sendEmail({ to: match.pilot_email, subject, html });
    } else {
      const body = loadMatchSmsBody({
        originCity: load.originCity,
        originState: load.originState,
        destinationCity: load.destinationCity,
        destinationState: load.destinationState,
        escortPositions: load.escortPositions,
        distanceMiles: match.distance_miles,
        locationLabel,
        loadUrl,
        posterPhone,
      });
      await sendSms({ to: normalizePhoneToE164(match.pilot_phone), body });
    }
    return true;
  } catch (error) {
    console.error(
      `Failed to send ${channel} alert for load ${load.id} to search location ${match.search_location_id}:`,
      error
    );
    return false;
  }
}

// One retry pass over exactly the rows that failed in this batch. Re-checks
// live DB state per row rather than trusting the closure, so "retry exactly
// once" is enforced by the attempts counter even if this function were ever
// accidentally called twice for the same rows -- not just by code
// discipline (only one call site today). Accepted tradeoff: if a send
// actually succeeds on Resend/Twilio's side but we fail to persist that
// before erroring, the retry could double-send. A duplicate alert is a
// much smaller problem than a missed one, so this isn't engineered around.
async function retryFailedAlerts(pending: PendingRetry[], load: LoadForAlert): Promise<void> {
  for (const { alertId, match, channel } of pending) {
    const current = await prisma.loadAlert.findUnique({ where: { id: alertId } });
    if (!current || current.status === AlertSendStatus.sent || current.attempts >= MAX_ATTEMPTS) {
      continue;
    }

    const succeeded = await performSend(channel, match, load);
    if (succeeded) {
      await prisma.loadAlert.update({
        where: { id: alertId },
        data: { status: AlertSendStatus.sent, attempts: { increment: 1 } },
      });
    } else {
      await prisma.loadAlert.update({
        where: { id: alertId },
        data: { attempts: { increment: 1 } },
      });
      // Surfaced in the admin dashboard too -- see /admin/failed-alerts.
      console.error(
        `Alert permanently failed after retry: loadId=${load.id} searchLocationId=${match.search_location_id} channel=${channel}`
      );
    }
  }
}
