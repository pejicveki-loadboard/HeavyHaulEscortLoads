import { SubscriptionStatus } from "@/generated/prisma/enums";
import { effectiveSubscriptionStatus, hasLoadBoardAccess } from "@/lib/subscription";

// Free-access promo: every Pilot Car profile has load-board access (search,
// load detail, contact reveal, and alerts) until this instant, regardless of
// trial/subscription state. 2027-03-01T06:00:00Z is midnight US Central on
// March 1, 2027.
//
// To EXTEND the promo, change this constant -- nothing else. To END it
// early, set it to a past instant; access then falls back to per-profile
// grants and the normal trial/subscription rules.
export const FREE_ACCESS_UNTIL = new Date("2027-03-01T06:00:00Z");

export const ACCESS_PAUSED_MESSAGE =
  "Your access is paused. Contact info@heavyhaulescortloads.com";

export type AccessProfile = {
  accessEnabled: boolean;
  freeAccessUntil: Date | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  pastDueSince?: Date | null;
};

// THE single access decision for Pilot Car load-board features. Every
// gate -- API routes, dashboard UI, and alert recipient filtering in
// load-matching.ts -- must call this rather than re-deriving the rule.
// Order matters:
//   1. admin switch off   -> deny (beats paid and promo)
//   2. global promo       -> allow
//   3. per-profile grant  -> allow
//   4. trial/subscription -> hasLoadBoardAccess()
export function hasAccess(profile: AccessProfile, now: Date = new Date()): boolean {
  if (profile.accessEnabled === false) return false;
  if (now.getTime() < FREE_ACCESS_UNTIL.getTime()) return true;
  if (profile.freeAccessUntil && profile.freeAccessUntil.getTime() > now.getTime()) return true;
  return hasLoadBoardAccess(profile, now);
}

// Why access was denied, so callers can show the right message: an
// admin-paused profile gets "contact us", not a subscribe prompt.
export function accessDenialReason(
  profile: AccessProfile,
  now: Date = new Date()
): "admin_off" | "no_subscription" | null {
  if (profile.accessEnabled === false) return "admin_off";
  return hasAccess(profile, now) ? null : "no_subscription";
}

// A grant is stored as the exclusive end instant (midnight Central starting
// the next day -- see central-date.ts), so show the last day it covers.
function formatLastCoveredDay(until: Date): string {
  return new Date(until.getTime() - 1).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Admin-facing label for a profile's current access, following the same
// precedence as hasAccess(). Past-due within the grace period still counts
// as "Paid" (access is still granted).
export function accessLabel(profile: AccessProfile, now: Date = new Date()): string {
  if (profile.accessEnabled === false) return "Off (admin)";
  if (now.getTime() < FREE_ACCESS_UNTIL.getTime()) return "Free (promo)";
  if (profile.freeAccessUntil && profile.freeAccessUntil.getTime() > now.getTime()) {
    return `Free (granted until ${formatLastCoveredDay(profile.freeAccessUntil)})`;
  }
  const status = effectiveSubscriptionStatus(profile, now);
  if (status === SubscriptionStatus.active || status === SubscriptionStatus.past_due) return "Paid";
  if (status === SubscriptionStatus.trialing) return "Trial";
  return "Expired";
}
