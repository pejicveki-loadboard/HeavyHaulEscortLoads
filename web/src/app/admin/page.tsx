import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { effectiveSubscriptionStatus } from "@/lib/subscription";
import { MAX_ATTEMPTS } from "@/lib/load-matching";
import { AlertSendStatus, SubscriptionStatus } from "@/generated/prisma/enums";
import { BuildingIcon, CarIcon, TruckIcon } from "@/components/icons";

export default async function AdminSummaryPage() {
  const [loadManagerCount, pilotCarCount, loadCount, pilotCarProfiles, failedAlertCount] = await Promise.all([
    prisma.loadManagerProfile.count(),
    prisma.pilotCarProfile.count(),
    prisma.load.count(),
    prisma.pilotCarProfile.findMany({
      select: { subscriptionStatus: true, trialEndsAt: true, pastDueSince: true },
    }),
    prisma.loadAlert.count({ where: { status: AlertSendStatus.failed, attempts: { gte: MAX_ATTEMPTS } } }),
  ]);

  const breakdown: Record<SubscriptionStatus, number> = {
    none: 0,
    trialing: 0,
    active: 0,
    past_due: 0,
    expired: 0,
  };
  for (const profile of pilotCarProfiles) {
    breakdown[effectiveSubscriptionStatus(profile)]++;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-text">Summary</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border border-brand-border bg-brand-panel p-4">
          <BuildingIcon className="mb-2 h-6 w-6 text-brand-accent" />
          <p className="text-sm text-brand-muted">Load Manager signups</p>
          <p className="text-2xl font-semibold text-brand-text">{loadManagerCount}</p>
        </div>
        <div className="rounded border border-brand-border bg-brand-panel p-4">
          <CarIcon className="mb-2 h-6 w-6 text-brand-accent" />
          <p className="text-sm text-brand-muted">Pilot Car signups</p>
          <p className="text-2xl font-semibold text-brand-text">{pilotCarCount}</p>
        </div>
        <div className="rounded border border-brand-border bg-brand-panel p-4">
          <TruckIcon className="mb-2 h-6 w-6 text-brand-accent" />
          <p className="text-sm text-brand-muted">Loads posted</p>
          <p className="text-2xl font-semibold text-brand-text">{loadCount}</p>
        </div>
      </div>

      <div className="rounded border border-brand-border bg-brand-panel p-4">
        <h2 className="mb-2 font-semibold text-brand-text">Pilot Car profiles by subscription status</h2>
        <p className="mb-3 text-sm text-brand-muted">
          Computed effective status (accounts for trials that expired but haven&apos;t been
          flipped in the DB yet), not the raw column.
        </p>
        <ul className="flex gap-6 text-sm">
          <li>
            <strong>{breakdown.trialing}</strong> trialing
          </li>
          <li>
            <strong>{breakdown.active}</strong> active
          </li>
          <li>
            <strong>{breakdown.past_due}</strong> past due (grace period)
          </li>
          <li>
            <strong>{breakdown.expired}</strong> expired
          </li>
          <li>
            <strong>{breakdown.none}</strong> none
          </li>
        </ul>
      </div>

      <div className="rounded border border-brand-border bg-brand-panel p-4">
        <h2 className="mb-2 font-semibold text-brand-text">Load alerts</h2>
        <p className="text-sm text-brand-text">
          <Link href="/admin/failed-alerts" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
            <strong>{failedAlertCount}</strong> permanently failed
          </Link>{" "}
          <span className="text-brand-muted">(exhausted retry -- driver never got notified)</span>
        </p>
      </div>
    </div>
  );
}
