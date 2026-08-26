import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceId } from "@/lib/stripe";
import { PlanInterval, SubscriptionStatus } from "@/generated/prisma/enums";

const schema = z.object({
  interval: z.enum(PlanInterval),
});

// "A monthly subscriber switching to annual takes effect at the next
// billing cycle, not mid-cycle" -- applied symmetrically to annual->monthly
// too, so neither direction produces a surprise mid-cycle proration charge
// or credit. Implemented with a Stripe Subscription Schedule: the current
// phase keeps billing at the existing price through currentPeriodEnd, and a
// second phase takes over at the new price from then on -- Stripe flips the
// underlying subscription's price automatically when the phase boundary is
// reached, which fires customer.subscription.updated and lets the webhook
// sync planInterval/pendingPlanInterval.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const targetInterval = parsed.data.interval;

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile || !profile.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
  }
  if (
    profile.subscriptionStatus !== SubscriptionStatus.active &&
    profile.subscriptionStatus !== SubscriptionStatus.past_due
  ) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
  }
  if (profile.planInterval === targetInterval) {
    return NextResponse.json({ error: "You're already on that plan." }, { status: 409 });
  }
  if (profile.pendingPlanInterval) {
    return NextResponse.json(
      { error: "A plan change is already scheduled for your next billing cycle." },
      { status: 409 }
    );
  }
  if (profile.cancelAtPeriodEnd) {
    return NextResponse.json(
      { error: "Your subscription is set to cancel — resume it before changing plans." },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
  const currentItem = subscription.items.data[0];
  const currentPeriodEnd = currentItem.current_period_end;
  const currentPriceId = currentItem.price.id;
  const newPriceId = getPriceId(targetInterval);

  // Stripe requires a subscription schedule to exist before it can be
  // phased; create one from the live subscription if it isn't on one yet
  // (schedule_id is on the subscription once it is).
  let scheduleId =
    typeof subscription.schedule === "string" ? subscription.schedule : subscription.schedule?.id;
  if (!scheduleId) {
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
    });
    scheduleId = schedule.id;
  }

  await stripe.subscriptionSchedules.update(scheduleId, {
    end_behavior: "release",
    phases: [
      {
        items: [{ price: currentPriceId, quantity: 1 }],
        start_date: currentItem.current_period_start,
        end_date: currentPeriodEnd,
      },
      {
        // No end_date/duration -- this phase runs indefinitely at the new
        // price. Combined with end_behavior: "release" below, once this
        // phase starts the schedule releases control back to a normal,
        // ongoing subscription rather than cancelling after one cycle.
        items: [{ price: newPriceId, quantity: 1 }],
      },
    ],
  });

  await prisma.pilotCarProfile.update({
    where: { id: profile.id },
    data: { pendingPlanInterval: targetInterval },
  });

  return NextResponse.json({
    pendingPlanInterval: targetInterval,
    effectiveAt: new Date(currentPeriodEnd * 1000).toISOString(),
  });
}
