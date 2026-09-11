import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { sendPushNotification, PushSubscriptionGoneError } from "@/lib/web-push";

// Additive push channel, called from matchAndAlertLoad alongside (not
// instead of) its existing email/sms loop -- see the call site there. Push
// fires for every match regardless of that SearchLocation's alertChannel
// (email|sms|both): push is opted into per-device from Account Settings,
// independent of a location's channel preference, so it isn't filtered by
// channelsFor() the way email/sms are.
//
// Unlike LoadAlert, there's no claim-then-attempt or retry pass here --
// push has no delivery guarantee to begin with, and matchAndAlertLoad is
// re-triggered on any edit that changes origin/escort positions, so a
// subscription with no PushNotificationLog row for this (load, cycle) yet
// will simply be tried again next time. A duplicate send if two triggers
// race is an accepted tradeoff, same call the existing retry logic makes.
export async function sendPushAlertsForMatches(
  matches: { search_location_id: string; pilot_car_profile_id: string }[],
  load: { id: string; originCity: string; originState: string; destinationCity: string; destinationState: string; alertCycle: number }
): Promise<void> {
  const profileIds = [...new Set(matches.map((m) => m.pilot_car_profile_id))];
  if (profileIds.length === 0) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { profileId: { in: profileIds } },
  });
  if (subscriptions.length === 0) return;

  const loadUrl = `${process.env.APP_BASE_URL}/l/${load.id}`;
  const payload = {
    title: "New load match",
    body: `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}`,
    url: loadUrl,
  };

  for (const subscription of subscriptions) {
    try {
      await sendPushNotification(subscription, payload);
      await prisma.pushNotificationLog.create({
        data: {
          loadId: load.id,
          subscriptionId: subscription.id,
          alertCycle: load.alertCycle,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // Already sent for this (load, subscription, cycle) -- another
        // trigger beat this one to it.
        continue;
      }
      if (error instanceof PushSubscriptionGoneError) {
        // The push service confirms this registration is dead (browser
        // uninstalled, permission revoked, etc.) -- self-clean rather than
        // retrying it forever.
        await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => {});
        continue;
      }
      console.error(
        `Failed to send push alert for load ${load.id} to subscription ${subscription.id}:`,
        error
      );
    }
  }
}
