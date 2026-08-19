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
