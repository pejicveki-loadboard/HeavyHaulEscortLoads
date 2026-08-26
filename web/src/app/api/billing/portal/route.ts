import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Hands the customer to Stripe's hosted Customer Portal so they can update
// their payment method (the actionable step during a past_due grace
// period) and see invoice history, without us building a card-entry form
// / pulling in Stripe.js on the client.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found." }, { status: 404 });
  }

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: "APP_BASE_URL is not configured." }, { status: 500 });
  }

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${baseUrl}/dashboard/pilot-car/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
