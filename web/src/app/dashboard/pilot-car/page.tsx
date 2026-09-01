import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatSubscriptionStatus } from "@/lib/trial-status";
import { hasLoadBoardAccess } from "@/lib/subscription";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import { BrowseLoadsPanel } from "@/components/browse-loads-panel";

export default async function PilotCarDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ loadId?: string; searchLocationId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { loadId, searchLocationId } = await searchParams;

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard/add-pilot-car");

  const searchLocations = await prisma.searchLocation.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "asc" },
  });
  const activeCount = searchLocations.filter((l) => l.active).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Pilot Car Dashboard</h1>
        <p className="text-brand-muted">
          {profile.companyName} ·{" "}
          <Link href="/dashboard/pilot-car/edit" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
            Edit profile
          </Link>
        </p>
      </div>

      <section className="rounded border border-brand-accent bg-brand-accent/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-brand-accent">
            {formatSubscriptionStatus(
              profile.subscriptionStatus,
              profile.trialEndsAt,
              profile.paidStartedAt,
              {
                pastDueSince: profile.pastDueSince,
                cancelAtPeriodEnd: profile.cancelAtPeriodEnd,
                currentPeriodEnd: profile.currentPeriodEnd,
              }
            )}
          </p>
          <Link
            href="/dashboard/pilot-car/billing"
            className="text-sm text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
          >
            Manage billing
          </Link>
        </div>
      </section>

      <section className="rounded border border-brand-border bg-brand-panel p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-brand-text">Search locations</h2>
          <Link href="/dashboard/pilot-car/search-locations" className="text-sm text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
            Manage
          </Link>
        </div>
        {searchLocations.length === 0 ? (
          <p className="text-sm text-brand-muted">
            You haven&apos;t added a search location yet — add one to start receiving load
            alerts.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-brand-muted">
            <li>
              {activeCount} active of {searchLocations.length} total
            </li>
            {searchLocations.map((location) => (
              <li key={location.id}>
                {location.label || `${location.city}, ${location.state}`} —{" "}
                {location.city}, {location.state} · {location.radiusMiles} mi ·{" "}
                {location.escortPositions
                  .map((p) => ESCORT_POSITIONS.find((pos) => pos.value === p)?.label ?? p)
                  .join(", ") || "no positions selected"}
                {!location.active && " (paused)"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded border border-brand-border bg-brand-panel p-4">
        <h2 className="mb-2 font-semibold text-brand-text">Load board</h2>
        {hasLoadBoardAccess(profile) ? (
          <BrowseLoadsPanel
            savedLocations={searchLocations
              .filter((l) => l.active)
              .map((l) => ({
                id: l.id,
                label: l.label,
                city: l.city,
                state: l.state,
                radiusMiles: l.radiusMiles,
                escortPositions: l.escortPositions,
              }))}
            initialLoadId={loadId}
            initialSearchLocationId={searchLocationId}
          />
        ) : (
          <p className="text-sm text-brand-muted">
            Your trial has ended —{" "}
            <Link
              href="/dashboard/pilot-car/billing"
              className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
            >
              subscribe
            </Link>{" "}
            to keep browsing loads.
          </p>
        )}
      </section>
    </div>
  );
}
