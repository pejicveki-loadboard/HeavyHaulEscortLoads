// Run with: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import { FREE_ACCESS_UNTIL, PROMO_COPY_SHORT, PROMO_COPY_SUBSCRIBER } from "@/lib/access";
import { formatSubscriptionStatus } from "@/lib/trial-status";

const DAY = 24 * 60 * 60 * 1000;
const DURING_PROMO = new Date(FREE_ACCESS_UNTIL.getTime() - 10 * DAY);
const AFTER_PROMO = new Date(FREE_ACCESS_UNTIL.getTime() + 10 * DAY);
const ended = new Date(DURING_PROMO.getTime() - 5 * DAY);

describe("formatSubscriptionStatus during the promo", () => {
  it("never says trial ended or subscribe", () => {
    for (const status of [SubscriptionStatus.none, SubscriptionStatus.trialing, SubscriptionStatus.expired]) {
      assert.equal(formatSubscriptionStatus(status, ended, null, { now: DURING_PROMO }), PROMO_COPY_SHORT);
    }
  });

  it("tells paying subscribers they won't be charged", () => {
    for (const status of [SubscriptionStatus.active, SubscriptionStatus.past_due]) {
      assert.equal(formatSubscriptionStatus(status, null, ended, { now: DURING_PROMO }), PROMO_COPY_SUBSCRIBER);
    }
  });

  it("goes back to the normal wording after the promo", () => {
    assert.equal(
      formatSubscriptionStatus(SubscriptionStatus.expired, ended, null, { now: AFTER_PROMO }),
      "Your trial has ended — subscribe to keep browsing loads"
    );
  });
});
