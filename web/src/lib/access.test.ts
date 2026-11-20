// Run with: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import { FREE_ACCESS_UNTIL, accessDenialReason, accessLabel, hasAccess, type AccessProfile } from "@/lib/access";

const DAY = 24 * 60 * 60 * 1000;
const DURING_PROMO = new Date(FREE_ACCESS_UNTIL.getTime() - 10 * DAY);
const AFTER_PROMO = new Date(FREE_ACCESS_UNTIL.getTime() + 10 * DAY);
const rel = (base: Date, days: number) => new Date(base.getTime() + days * DAY);

function profile(overrides: Partial<AccessProfile>): AccessProfile {
  return {
    accessEnabled: true,
    freeAccessUntil: null,
    subscriptionStatus: SubscriptionStatus.none,
    trialEndsAt: null,
    pastDueSince: null,
    ...overrides,
  };
}

const paid = (o: Partial<AccessProfile> = {}) => profile({ subscriptionStatus: SubscriptionStatus.active, ...o });
const expiredTrial = (now: Date, o: Partial<AccessProfile> = {}) =>
  profile({ subscriptionStatus: SubscriptionStatus.trialing, trialEndsAt: rel(now, -5), ...o });

describe("hasAccess", () => {
  it("denies an admin-off paid user (during and after promo)", () => {
    const p = paid({ accessEnabled: false });
    assert.equal(hasAccess(p, DURING_PROMO), false);
    assert.equal(hasAccess(p, AFTER_PROMO), false);
    assert.equal(accessDenialReason(p, AFTER_PROMO), "admin_off");
  });

  it("admin-off beats a free-access grant", () => {
    assert.equal(hasAccess(expiredTrial(AFTER_PROMO, { accessEnabled: false, freeAccessUntil: rel(AFTER_PROMO, 30) }), AFTER_PROMO), false);
  });

  it("allows an expired trial while the promo is active", () => {
    assert.equal(hasAccess(expiredTrial(DURING_PROMO), DURING_PROMO), true);
    assert.equal(hasAccess(profile({ subscriptionStatus: SubscriptionStatus.expired }), DURING_PROMO), true);
  });

  it("allows after the promo when freeAccessUntil is in the future", () => {
    assert.equal(hasAccess(expiredTrial(AFTER_PROMO, { freeAccessUntil: rel(AFTER_PROMO, 1) }), AFTER_PROMO), true);
  });

  it("denies after the promo when freeAccessUntil has passed", () => {
    assert.equal(hasAccess(expiredTrial(AFTER_PROMO, { freeAccessUntil: rel(AFTER_PROMO, -1) }), AFTER_PROMO), false);
  });

  it("denies an expired trial after the promo", () => {
    const p = expiredTrial(AFTER_PROMO);
    assert.equal(hasAccess(p, AFTER_PROMO), false);
    assert.equal(accessDenialReason(p, AFTER_PROMO), "no_subscription");
  });

  it("allows an active paid subscriber after the promo", () => {
    assert.equal(hasAccess(paid(), AFTER_PROMO), true);
  });

  it("allows past_due within grace after the promo, denies after grace", () => {
    assert.equal(hasAccess(profile({ subscriptionStatus: SubscriptionStatus.past_due, pastDueSince: rel(AFTER_PROMO, -1) }), AFTER_PROMO), true);
    assert.equal(hasAccess(profile({ subscriptionStatus: SubscriptionStatus.past_due, pastDueSince: rel(AFTER_PROMO, -4) }), AFTER_PROMO), false);
  });

  it("promo boundary: access ends exactly at FREE_ACCESS_UNTIL", () => {
    const p = expiredTrial(FREE_ACCESS_UNTIL);
    assert.equal(hasAccess(p, new Date(FREE_ACCESS_UNTIL.getTime() - 1)), true);
    assert.equal(hasAccess(p, FREE_ACCESS_UNTIL), false);
  });
});

describe("accessLabel", () => {
  it("labels each state", () => {
    assert.equal(accessLabel(paid({ accessEnabled: false }), DURING_PROMO), "Off (admin)");
    assert.equal(accessLabel(expiredTrial(DURING_PROMO), DURING_PROMO), "Free (promo)");
    assert.match(
      accessLabel(expiredTrial(AFTER_PROMO, { freeAccessUntil: new Date("2027-06-15T17:00:00Z") }), AFTER_PROMO),
      /^Free \(granted until Jun 15, 2027\)$/
    );
    // Stored exclusive end (midnight Central Jun 16) shows the last covered day.
    assert.equal(
      accessLabel(expiredTrial(AFTER_PROMO, { freeAccessUntil: new Date("2027-06-16T05:00:00Z") }), AFTER_PROMO),
      "Free (granted until Jun 15, 2027)"
    );
    assert.equal(accessLabel(paid(), AFTER_PROMO), "Paid");
    assert.equal(
      accessLabel(profile({ subscriptionStatus: SubscriptionStatus.trialing, trialEndsAt: rel(AFTER_PROMO, 5) }), AFTER_PROMO),
      "Trial"
    );
    assert.equal(accessLabel(expiredTrial(AFTER_PROMO), AFTER_PROMO), "Expired");
  });
});
