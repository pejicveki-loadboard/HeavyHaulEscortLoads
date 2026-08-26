import { SubscriptionStatus } from "@/generated/prisma/enums";
import { GRACE_PERIOD_DAYS } from "@/lib/subscription";

export function formatSubscriptionStatus(
  status: SubscriptionStatus,
  trialEndsAt: Date | null,
  paidStartedAt: Date | null,
  options?: { pastDueSince?: Date | null; cancelAtPeriodEnd?: boolean; currentPeriodEnd?: Date | null }
): string {
  if (status === SubscriptionStatus.active) {
    const base = paidStartedAt
      ? `Active subscription (since ${paidStartedAt.toLocaleDateString()})`
      : "Active subscription";
    if (options?.cancelAtPeriodEnd && options.currentPeriodEnd) {
      return `${base} — cancels ${options.currentPeriodEnd.toLocaleDateString()}, access continues until then`;
    }
    return base;
  }

  if (status === SubscriptionStatus.past_due) {
    const pastDueSince = options?.pastDueSince ?? null;
    if (!pastDueSince) return "Payment issue — update your card to avoid losing access";
    const graceEndsAt = new Date(
      pastDueSince.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
    );
    const daysLeft = Math.ceil((graceEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return "Your payment failed and access has been suspended — update your card to resume";
    return `Payment failed — update your card within ${daysLeft} day${daysLeft === 1 ? "" : "s"} to keep access`;
  }

  if (status === SubscriptionStatus.trialing) {
    if (!trialEndsAt) return "Trial active";
    const daysLeft = Math.ceil(
      (trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 0) return "Your trial has ended";
    if (daysLeft === 1) return "1 day left in your trial";
    return `${daysLeft} days left in your trial`;
  }

  if (status === SubscriptionStatus.expired) {
    return "Your trial has ended — subscribe to keep browsing loads";
  }

  return "No active subscription";
}
