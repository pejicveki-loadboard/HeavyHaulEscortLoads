import { prisma } from "@/lib/prisma";
import { effectiveSubscriptionStatus } from "@/lib/subscription";
import { SubscriptionStatus } from "@/generated/prisma/enums";

export default async function AdminSummaryPage() {
  const [loadManagerCount, pilotCarCount, loadCount, pilotCarProfiles] = await Promise.all([
    prisma.loadManagerProfile.count(),
    prisma.pilotCarProfile.count(),
    prisma.load.count(),
    prisma.pilotCarProfile.findMany({
      select: { subscriptionStatus: true, trialEndsAt: true },
    }),
  ]);

  const breakdown: Record<SubscriptionStatus, number> = {
    none: 0,
    trialing: 0,
    active: 0,
    expired: 0,
  };
  for (const profile of pilotCarProfiles) {
    breakdown[effectiveSubscriptionStatus(profile)]++;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Summary</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border border-gray-300 p-4">
          <p className="text-sm text-gray-600">Load Manager signups</p>
          <p className="text-2xl font-semibold">{loadManagerCount}</p>
        </div>
        <div className="rounded border border-gray-300 p-4">
          <p className="text-sm text-gray-600">Pilot Car signups</p>
          <p className="text-2xl font-semibold">{pilotCarCount}</p>
        </div>
        <div className="rounded border border-gray-300 p-4">
          <p className="text-sm text-gray-600">Loads posted</p>
          <p className="text-2xl font-semibold">{loadCount}</p>
        </div>
      </div>

      <div className="rounded border border-gray-300 p-4">
        <h2 className="mb-2 font-semibold">Pilot Car profiles by subscription status</h2>
        <p className="mb-3 text-sm text-gray-600">
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
            <strong>{breakdown.expired}</strong> expired
          </li>
          <li>
            <strong>{breakdown.none}</strong> none
          </li>
        </ul>
      </div>
    </div>
  );
}
