import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, planIntervalForPriceId } from "@/lib/stripe";
import { GRACE_PERIOD_DAYS } from "@/lib/subscription";
import { sendEmail } from "@/lib/resend";
import { paymentFailedEmail } from "@/lib/email-templates";
import { SubscriptionStatus } from "@/generated/prisma/enums";

// Stripe signs the raw request body -- Next.js route handlers don't parse
// the body unless you call a parsing method, so request.text() here is
// already the exact bytes Stripe hashed. Never JSON.parse it before
// verifying.
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      default:
        // Unhandled event types are expected -- Stripe sends far more
        // events than we act on. Acknowledge with 200 either way.
        break;
    }
  } catch (error) {
    console.error(`Failed to process Stripe webhook ${event.type} (${event.id}):`, error);
    // 500 tells Stripe to retry with backoff, which is what we want for a
    // transient DB/network error rather than silently dropping the event.
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items.data[0];
  return item ? new Date(item.current_period_end * 1000) : null;
}

function subscriptionPriceId(subscription: Stripe.Subscription): string | undefined {
  return subscription.items.data[0]?.price.id;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription" || !session.subscription) return;

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) return;

  const profile = await prisma.pilotCarProfile.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!profile) {
    console.error(`No PilotCarProfile found for Stripe customer ${customerId}.`);
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const priceId = subscriptionPriceId(subscription);
  const planInterval = priceId ? planIntervalForPriceId(priceId) : null;

  await prisma.pilotCarProfile.update({
    where: { id: profile.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: SubscriptionStatus.active,
      planInterval: planInterval ?? profile.planInterval,
      pendingPlanInterval: null,
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      pastDueSince: null,
      // Only set on first conversion -- never overwritten by a later
      // resubscribe, matching "the moment subscriptionStatus first
      // transitions to active" from the schema comment.
      paidStartedAt: profile.paidStartedAt ?? new Date(),
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const profile = await prisma.pilotCarProfile.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!profile) return;

  const priceId = subscriptionPriceId(subscription);
  const planInterval = priceId ? planIntervalForPriceId(priceId) : null;

  // The scheduled plan switch has taken effect once the subscription's
  // live price matches what was pending.
  const pendingPlanInterval =
    profile.pendingPlanInterval && planInterval === profile.pendingPlanInterval
      ? null
      : profile.pendingPlanInterval;

  // We drive the 3-day grace period ourselves off pastDueSince (set by
  // invoice.payment_failed) rather than trusting Stripe's own dunning
  // timeline -- see GRACE_PERIOD_DAYS in src/lib/subscription.ts. Only
  // mirror Stripe's status here when it's unambiguous (active), or as a
  // fallback if we somehow see past_due without pastDueSince already set.
  let subscriptionStatus = profile.subscriptionStatus;
  let pastDueSince = profile.pastDueSince;
  if (subscription.status === "active") {
    subscriptionStatus = SubscriptionStatus.active;
    pastDueSince = null;
  } else if (subscription.status === "past_due" && subscriptionStatus !== SubscriptionStatus.past_due) {
    subscriptionStatus = SubscriptionStatus.past_due;
    pastDueSince = pastDueSince ?? new Date();
  }

  await prisma.pilotCarProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus,
      planInterval: planInterval ?? profile.planInterval,
      pendingPlanInterval,
      currentPeriodEnd: subscriptionPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      pastDueSince,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const profile = await prisma.pilotCarProfile.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!profile) return;

  await prisma.pilotCarProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: SubscriptionStatus.expired,
      cancelAtPeriodEnd: false,
      pendingPlanInterval: null,
      pastDueSince: null,
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const profile = await prisma.pilotCarProfile.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    include: { user: { select: { email: true } } },
  });
  if (!profile) return;

  const alreadyPastDue = !!profile.pastDueSince;

  await prisma.pilotCarProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: SubscriptionStatus.past_due,
      pastDueSince: profile.pastDueSince ?? new Date(),
    },
  });

  // Only email on the first failure of this billing cycle -- Stripe's
  // smart retries can fire this event more than once while pastDueSince
  // (and the grace-period clock) stays fixed to the first failure.
  if (!alreadyPastDue) {
    const baseUrl = process.env.APP_BASE_URL;
    try {
      await sendEmail({
        to: profile.user.email,
        ...paymentFailedEmail({
          graceDays: GRACE_PERIOD_DAYS,
          billingUrl: `${baseUrl ?? ""}/dashboard/pilot-car/billing`,
        }),
      });
    } catch (error) {
      console.error(`Failed to send payment-failed email for profile ${profile.id}:`, error);
    }
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const profile = await prisma.pilotCarProfile.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!profile) return;

  await prisma.pilotCarProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: SubscriptionStatus.active,
      pastDueSince: null,
      paidStartedAt: profile.paidStartedAt ?? new Date(),
    },
  });
}

// Stripe API versions from late 2025 onward moved `subscription` off the
// top-level Invoice object; it's on invoice.parent for subscription-cycle
// invoices instead. Fall back to the old field for safety across versions.
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | { id: string } | null })
    .subscription;
  if (legacy) return typeof legacy === "string" ? legacy : legacy.id;

  const parent = invoice.parent;
  if (parent?.type === "subscription_details" && parent.subscription_details?.subscription) {
    const sub = parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  return null;
}
