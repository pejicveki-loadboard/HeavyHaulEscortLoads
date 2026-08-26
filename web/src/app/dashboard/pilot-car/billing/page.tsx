import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatSubscriptionStatus } from "@/lib/trial-status";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import { SubscribePanel, ManageSubscriptionPanel } from "@/components/billing-panel";

export default async function PilotCarBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard/add-pilot-car");

  const { checkout } = await searchParams;

  const hasStripeSubscription =
    profile.subscriptionStatus === SubscriptionStatus.active ||
    profile.subscriptionStatus === SubscriptionStatus.past_due;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Billing</h1>
        <p className="text-brand-muted">{profile.companyName}</p>
      </div>

      {checkout === "success" && (
        <p className="rounded border border-green-800 bg-green-950 p-3 text-sm text-green-400">
          Subscription active — thanks for subscribing.
        </p>
      )}
      {checkout === "cancelled" && (
        <p className="rounded border border-brand-border bg-brand-panel p-3 text-sm text-brand-muted">
          Checkout was cancelled — no charge was made.
        </p>
      )}

      <section className="rounded border border-brand-accent bg-brand-accent/10 p-4">
        <p className="font-semibold text-brand-accent">
          {formatSubscriptionStatus(profile.subscriptionStatus, profile.trialEndsAt, profile.paidStartedAt, {
            pastDueSince: profile.pastDueSince,
            cancelAtPeriodEnd: profile.cancelAtPeriodEnd,
            currentPeriodEnd: profile.currentPeriodEnd,
          })}
        </p>
        {profile.planInterval && (
          <p className="mt-1 text-sm text-brand-text">
            Current plan: {profile.planInterval === "monthly" ? "Monthly ($17.99/mo)" : "Annual ($179.88/yr)"}
          </p>
        )}
        {profile.pendingPlanInterval && (
          <p className="mt-1 text-sm text-brand-text">
            Switching to {profile.pendingPlanInterval === "monthly" ? "Monthly" : "Annual"} on{" "}
            {profile.currentPeriodEnd?.toLocaleDateString() ?? "your next billing date"}.
          </p>
        )}
      </section>

      <section className="rounded border border-brand-border bg-brand-panel p-4">
        {hasStripeSubscription ? (
          <ManageSubscriptionPanel
            planInterval={profile.planInterval ?? "monthly"}
            pendingPlanInterval={profile.pendingPlanInterval}
            cancelAtPeriodEnd={profile.cancelAtPeriodEnd}
          />
        ) : (
          <SubscribePanel />
        )}
      </section>
    </div>
  );
}
