// One-time setup script: creates the Stripe Product + two Prices for the
// Pilot Car subscription in whatever mode your STRIPE_SECRET_KEY belongs to
// (sandbox/test key -> test mode, safe to run against). Prints the
// resulting price IDs -- paste those into .env as STRIPE_PRICE_MONTHLY /
// STRIPE_PRICE_ANNUAL. Price IDs aren't secret; this script never prints
// STRIPE_SECRET_KEY itself.
//
// Safe to re-run: looks up existing prices by lookup_key first instead of
// creating duplicates.
//
// Usage: node scripts/setup-stripe-products.mjs

import "dotenv/config";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("STRIPE_SECRET_KEY is not set in .env -- add it first, then re-run this script.");
  process.exit(1);
}
if (!secretKey.startsWith("sk_test_")) {
  console.error(
    "STRIPE_SECRET_KEY doesn't look like a test-mode key (expected it to start with sk_test_). " +
      "Refusing to run against what might be a live key."
  );
  process.exit(1);
}

const stripe = new Stripe(secretKey);

const PLANS = [
  {
    lookupKey: "pilot_car_monthly",
    envVar: "STRIPE_PRICE_MONTHLY",
    nickname: "Pilot Car Monthly",
    unitAmount: 1799, // $17.99
    interval: "month",
  },
  {
    lookupKey: "pilot_car_annual",
    envVar: "STRIPE_PRICE_ANNUAL",
    nickname: "Pilot Car Annual (2 months free)",
    unitAmount: 17988, // $179.88 ($14.99/mo effective)
    interval: "year",
  },
];

async function getOrCreateProduct() {
  const existing = await stripe.products.search({
    query: "name:'Pilot Car Load Board Subscription' AND active:'true'",
  });
  if (existing.data[0]) return existing.data[0];

  return stripe.products.create({
    name: "Pilot Car Load Board Subscription",
    description: "Load-board access for Pilot Car companies -- search, alerts, and contact reveal.",
  });
}

async function getOrCreatePrice(productId, plan) {
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], limit: 1 });
  if (existing.data[0]) return existing.data[0];

  return stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: plan.unitAmount,
    recurring: { interval: plan.interval },
    lookup_key: plan.lookupKey,
    nickname: plan.nickname,
  });
}

async function main() {
  const product = await getOrCreateProduct();
  console.log(`Product: ${product.name} (${product.id})`);

  const results = [];
  for (const plan of PLANS) {
    const price = await getOrCreatePrice(product.id, plan);
    results.push({ ...plan, priceId: price.id });
    console.log(`  ${plan.nickname}: ${price.id}`);
  }

  console.log("\nAdd these to your .env:\n");
  for (const r of results) {
    console.log(`${r.envVar}="${r.priceId}"`);
  }
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
