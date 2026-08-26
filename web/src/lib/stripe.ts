import Stripe from "stripe";
import { PlanInterval } from "@/generated/prisma/enums";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not set.");
  if (!client) client = new Stripe(secretKey);
  return client;
}

// The two Phase 2 plans -- see pricing/page.tsx for the customer-facing
// copy. Price IDs come from the Stripe Products/Prices created by
// scripts/setup-stripe-products.mjs (or created by hand in the Dashboard)
// and pasted into .env.
export const PLAN_PRICE_ENV: Record<PlanInterval, string> = {
  monthly: "STRIPE_PRICE_MONTHLY",
  annual: "STRIPE_PRICE_ANNUAL",
};

export function getPriceId(interval: PlanInterval): string {
  const envVar = PLAN_PRICE_ENV[interval];
  const priceId = process.env[envVar];
  if (!priceId) throw new Error(`${envVar} is not set.`);
  return priceId;
}

// Reverse lookup used by the webhook handler to figure out which plan a
// Stripe price/subscription item corresponds to, without trusting
// Stripe-side price metadata.
export function planIntervalForPriceId(priceId: string): PlanInterval | null {
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return PlanInterval.monthly;
  if (priceId === process.env.STRIPE_PRICE_ANNUAL) return PlanInterval.annual;
  return null;
}
