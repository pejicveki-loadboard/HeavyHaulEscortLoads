import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { AlertChannel, AlertSendStatus } from "@/generated/prisma/enums";
import type { EscortPosition } from "@/generated/prisma/enums";
import { sendEmail } from "@/lib/resend";
import { sendSms } from "@/lib/twilio";
import { normalizePhoneToE164 } from "@/lib/phone";
import { loadMatchEmail, loadMatchSmsBody } from "@/lib/email-templates";

// A row is claimed (inserted) then retried at most once, so the highest
// legitimate attempts value is 2 (initial + one retry).
const MAX_ATTEMPTS = 2;

type MatchRow = {
  search_location_id: string;
  pilot_email: string;
  pilot_phone: string;
  distance_miles: number;
};

type LoadForAlert = {
  id: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  escortPositions: EscortPosition[];
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
// positions (see the loads API routes).
//
// Each match's send is attempted once inline (so the initial fan-out stays
// "real-time" per the plan), and any failures get exactly one retry pass
// scheduled via after() once this function returns -- see retryFailedAlerts.
export async function matchAndAlertLoad(loadId: string): Promise<void> {
  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load || load.status !== "open") return;

  const matches = await prisma.$queryRaw<MatchRow[]>`
    SELECT sl.id as search_location_id, u.email as pilot_email, pcp.phone as pilot_phone,
      (3959 * acos(least(1, greatest(-1,
        cos(radians(sl.lat)) * cos(radians(${load.originLat})) * cos(radians(${load.originLng}) - radians(sl.lng))
        + sin(radians(sl.lat)) * sin(radians(${load.originLat}))
      )))) as distance_miles
    FROM search_locations sl
    JOIN pilot_car_profiles pcp ON pcp.id = sl.profile_id
    JOIN users u ON u.id = pcp.user_id
    WHERE sl.active = true
      AND pcp.alerts_muted = false
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
    for (const channel of [AlertChannel.email, AlertChannel.sms]) {
      const result = await attemptAlert(loadId, match, load, channel);
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
    after(() => retryFailedAlerts(toRetry, load));
  }
}

// Inserts the LoadAlert row first (claiming the (load, location, channel)
// slot via the unique constraint) before attempting the send, so a
// concurrent re-trigger of matching can never double-send. Returns null if
// the slot was already claimed by an earlier trigger (nothing to do here).
async function attemptAlert(
  loadId: string,
  match: MatchRow,
  load: LoadForAlert,
  channel: AlertChannel
): Promise<{ id: string; failed: boolean } | null> {
  let alert;
  try {
    alert = await prisma.loadAlert.create({
      data: { loadId, searchLocationId: match.search_location_id, channel, attempts: 1 },
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
  try {
    if (channel === AlertChannel.email) {
      const { subject, html } = loadMatchEmail({
        originCity: load.originCity,
        originState: load.originState,
        destinationCity: load.destinationCity,
        destinationState: load.destinationState,
        escortPositions: load.escortPositions,
        distanceMiles: match.distance_miles,
        loadUrl: `${process.env.APP_BASE_URL}/dashboard/pilot-car`,
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
      // TODO(Week 3): surface permanently-failed alerts somewhere visible
      // (e.g. the admin dashboard) instead of just this log line.
      console.error(
        `Alert permanently failed after retry: loadId=${load.id} searchLocationId=${match.search_location_id} channel=${channel}`
      );
    }
  }
}
