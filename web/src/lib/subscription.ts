import { SubscriptionStatus } from "@/generated/prisma/enums";

// "trialing (and not expired), or active only" -- see PHASE1_PLAN.md's
// access control model. Load-board endpoints (browse, contact reveal)
// must check this server-side on every request.
//
// TODO(Week 3 admin dashboard): this computes access live instead of
// trusting the stored subscriptionStatus column, so that column can go
// stale -- a profile whose trial actually expired still reads
// subscriptionStatus = "trialing" in the DB forever, since nothing flips
// it. Fine for access control (this function is the source of truth
// there), but the admin dashboard's trialing/expired counts and the Users
// table's subscription_status column will overcount trialing/undercount
// expired if they just read the raw column. When building that: either
// compute "effective status" the same way this function does, or add a
// scheduled job that actually flips expired trials to `expired`.
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
