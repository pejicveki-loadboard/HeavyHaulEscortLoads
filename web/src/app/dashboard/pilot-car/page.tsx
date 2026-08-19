import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatSubscriptionStatus } from "@/lib/trial-status";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";

export default async function PilotCarDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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
        <h1 className="text-2xl font-semibold">Pilot Car Dashboard</h1>
        <p className="text-gray-600">
          {profile.companyName} ·{" "}
          <Link href="/dashboard/pilot-car/edit" className="underline">
            Edit profile
          </Link>
        </p>
      </div>

      <section className="rounded border border-amber-300 bg-amber-50 p-4">
        <p className="font-semibold text-amber-900">
          {formatSubscriptionStatus(
            profile.subscriptionStatus,
            profile.trialEndsAt,
            profile.paidStartedAt
          )}
        </p>
      </section>

      <section className="rounded border border-gray-300 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Search locations</h2>
          <Link href="/dashboard/pilot-car/search-locations" className="text-sm underline">
            Manage
          </Link>
        </div>
        {searchLocations.length === 0 ? (
          <p className="text-sm text-gray-600">
            You haven&apos;t added a search location yet — add one to start receiving load
            alerts.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-gray-600">
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

      <section className="rounded border border-gray-300 p-4">
        <h2 className="mb-2 font-semibold">Load board</h2>
        <p className="text-sm text-gray-600">
          Browsing and filtering loads by radius is coming in Week 2.
        </p>
      </section>
    </div>
  );
}
