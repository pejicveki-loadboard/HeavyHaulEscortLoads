import { SubscriptionStatus } from "@/generated/prisma/enums";

// "A failed monthly payment gets a 3-day grace period before losing
// access." Applied uniformly to any past_due profile (Stripe's own retry
// timing is separate from -- and not trusted for -- this cutoff; we drive
// it ourselves off pastDueSince, set by the invoice.payment_failed webhook).
export const GRACE_PERIOD_DAYS = 3;

function inGracePeriod(pastDueSince: Date | null): boolean {
  if (!pastDueSince) return false;
  const graceEndsAt = pastDueSince.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() < graceEndsAt;
}

// "trialing (and not expired), active, or past_due within its 3-day grace
// window only" -- see PHASE1_PLAN.md's access control model. Load-board
// endpoints (search, load list, load detail, contact info) must check this
// server-side on every request.
export function hasLoadBoardAccess(profile: {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  pastDueSince?: Date | null;
}): boolean {
  if (profile.subscriptionStatus === SubscriptionStatus.active) return true;
  if (profile.subscriptionStatus === SubscriptionStatus.trialing) {
    return !!profile.trialEndsAt && profile.trialEndsAt.getTime() > Date.now();
  }
  if (profile.subscriptionStatus === SubscriptionStatus.past_due) {
    return inGracePeriod(profile.pastDueSince ?? null);
  }
  return false;
}

// Resolves the Week 2 Day 4 TODO: subscriptionStatus can go stale (nothing
// flips a profile from trialing to expired when trialEndsAt passes, and
// nothing flips past_due to expired once its grace period runs out), so the
// raw column can overcount trialing/past_due and undercount expired. The
// Week 3 admin dashboard uses this instead of the raw column for both the
// summary breakdown and the Users table's displayed status -- same logic as
// hasLoadBoardAccess, just returning the enum value instead of a boolean.
export function effectiveSubscriptionStatus(profile: {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  pastDueSince?: Date | null;
}): SubscriptionStatus {
  if (profile.subscriptionStatus === SubscriptionStatus.trialing) {
    const stillTrialing = !!profile.trialEndsAt && profile.trialEndsAt.getTime() > Date.now();
    return stillTrialing ? SubscriptionStatus.trialing : SubscriptionStatus.expired;
  }
  if (profile.subscriptionStatus === SubscriptionStatus.past_due) {
    return inGracePeriod(profile.pastDueSince ?? null)
      ? SubscriptionStatus.past_due
      : SubscriptionStatus.expired;
  }
  return profile.subscriptionStatus;
}
