import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceId } from "@/lib/stripe";
import { PlanInterval, SubscriptionStatus } from "@/generated/prisma/enums";

const schema = z.object({
  interval: z.enum(PlanInterval),
});

// Starts a brand-new subscription (none / trialing / expired -> active).
// Not used for an existing active/past_due subscriber changing plans --
// that's /api/billing/change-plan, which defers the switch to the next
// billing cycle instead of starting a second subscription.
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

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
  });
  if (!profile) {
    return NextResponse.json({ error: "No Pilot Car profile found." }, { status: 404 });
  }
  if (
    profile.subscriptionStatus === SubscriptionStatus.active ||
    profile.subscriptionStatus === SubscriptionStatus.past_due
  ) {
    return NextResponse.json(
      { error: "You already have a subscription. Manage it from the billing page instead." },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "APP_BASE_URL is not configured." }, { status: 500 });
  }

  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.user.email,
      metadata: { pilotCarProfileId: profile.id },
    });
    customerId = customer.id;
    await prisma.pilotCarProfile.update({
      where: { id: profile.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getPriceId(parsed.data.interval), quantity: 1 }],
    success_url: `${baseUrl}/dashboard/pilot-car/billing?checkout=success`,
    cancel_url: `${baseUrl}/dashboard/pilot-car/billing?checkout=cancelled`,
    // Belt-and-suspenders: the webhook is the source of truth for who this
    // subscription belongs to, but carrying the profile id through
    // subscription metadata too means change-plan/cancel can't be pointed
    // at the wrong Stripe object even if stripeSubscriptionId is stale.
    subscription_data: {
      metadata: { pilotCarProfileId: profile.id },
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
