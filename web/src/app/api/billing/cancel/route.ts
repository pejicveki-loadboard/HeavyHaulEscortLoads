import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { SubscriptionStatus } from "@/generated/prisma/enums";

// "Annual cancellations get no refund but keep access through the paid
// term" -- applied the same way to monthly (Stripe's cancel_at_period_end
// never prorates/refunds the current period either way, it just stops
// renewal). The subscription keeps billing status active/past_due and
// access keeps working until Stripe actually ends it at period end, which
// fires customer.subscription.deleted and flips subscriptionStatus to
// expired via the webhook.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

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
  if (profile.cancelAtPeriodEnd) {
    return NextResponse.json({ error: "Already set to cancel." }, { status: 409 });
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.update(profile.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.pilotCarProfile.update({
    where: { id: profile.id },
    data: { cancelAtPeriodEnd: true },
  });

  return NextResponse.json({
    cancelAtPeriodEnd: true,
    accessUntil: subscription.items.data[0]
      ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
      : null,
  });
}
