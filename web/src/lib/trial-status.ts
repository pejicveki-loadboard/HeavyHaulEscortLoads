import { SubscriptionStatus } from "@/generated/prisma/enums";

export function formatSubscriptionStatus(
  status: SubscriptionStatus,
  trialEndsAt: Date | null,
  paidStartedAt: Date | null
): string {
  if (status === SubscriptionStatus.active) {
    return paidStartedAt
      ? `Active subscription (since ${paidStartedAt.toLocaleDateString()})`
      : "Active subscription";
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
