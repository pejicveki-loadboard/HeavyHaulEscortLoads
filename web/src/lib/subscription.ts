import { SubscriptionStatus } from "@/generated/prisma/enums";

// "trialing (and not expired), or active only" -- see PHASE1_PLAN.md's
// access control model. Load-board endpoints (browse, contact reveal)
// must check this server-side on every request.
export function hasLoadBoardAccess(profile: {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
}): boolean {
  if (profile.subscriptionStatus === SubscriptionStatus.active) return true;
  if (profile.subscriptionStatus === SubscriptionStatus.trialing) {
    return !!profile.trialEndsAt && profile.trialEndsAt.getTime() > Date.now();
  }
  return false;
}

// Resolves the Week 2 Day 4 TODO: subscriptionStatus can go stale (nothing
// flips a profile from trialing to expired when trialEndsAt passes), so the
// raw column overcounts trialing/undercounts expired. The Week 3 admin
// dashboard uses this instead of the raw column for both the summary
// breakdown and the Users table's displayed status -- same logic as
// hasLoadBoardAccess, just returning the enum value instead of a boolean.
export function effectiveSubscriptionStatus(profile: {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
}): SubscriptionStatus {
  if (profile.subscriptionStatus !== SubscriptionStatus.trialing) {
    return profile.subscriptionStatus;
  }
  const stillTrialing = !!profile.trialEndsAt && profile.trialEndsAt.getTime() > Date.now();
  return stillTrialing ? SubscriptionStatus.trialing : SubscriptionStatus.expired;
}
