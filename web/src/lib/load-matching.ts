import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { AlertChannel } from "@/generated/prisma/enums";
import { sendEmail } from "@/lib/resend";
import { sendSms } from "@/lib/twilio";
import { normalizePhoneToE164 } from "@/lib/phone";
import { loadMatchEmail, loadMatchSmsBody } from "@/lib/email-templates";

type MatchRow = {
  search_location_id: string;
  pilot_email: string;
  pilot_phone: string;
  distance_miles: number;
};

// Runs the same radius+escort-position match as browse, but against every
// active SearchLocation on a trialing (not expired)/active PilotCarProfile,
// with no dedup across a profile's own locations -- see PHASE1_PLAN.md Week
// 2 Day 4. Called on load create and on edits that change origin or escort
// positions (see the loads API routes).
//
// Fires both email and SMS per match. LoadAlert rows are inserted before
// the actual send (claiming the (load, location, channel) slot) so a
// re-triggered match (e.g. an unrelated edit re-running this) never
// double-sends -- the tradeoff is that if the send itself throws after the
// row is inserted, that channel won't be retried. Acceptable for MVP; a
// real outbox/retry pattern is future work, not in scope here.
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

  for (const match of matches) {
    await tryAlert(loadId, match, load, AlertChannel.email);
    await tryAlert(loadId, match, load, AlertChannel.sms);
  }
}

async function tryAlert(
  loadId: string,
  match: MatchRow,
  load: {
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    escortPositions: string[];
  },
  channel: AlertChannel
) {
  try {
    await prisma.loadAlert.create({
      data: { loadId, searchLocationId: match.search_location_id, channel },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return;
    throw e;
  }

  try {
    const escortPositions = load.escortPositions as Parameters<
      typeof loadMatchEmail
    >[0]["escortPositions"];

    if (channel === AlertChannel.email) {
      const { subject, html } = loadMatchEmail({
        originCity: load.originCity,
        originState: load.originState,
        destinationCity: load.destinationCity,
        destinationState: load.destinationState,
        escortPositions,
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
        escortPositions,
        distanceMiles: match.distance_miles,
      });
      await sendSms({ to: normalizePhoneToE164(match.pilot_phone), body });
    }
  } catch (error) {
    console.error(
      `Failed to send ${channel} alert for load ${loadId} to search location ${match.search_location_id}:`,
      error
    );
  }
}
