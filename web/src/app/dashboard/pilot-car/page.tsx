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

  const positionLabels = profile.escortPositions
    .map((p) => ESCORT_POSITIONS.find((pos) => pos.value === p)?.label ?? p)
    .join(", ");

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
        <h2 className="mb-2 font-semibold">Your alert preferences</h2>
        <p className="text-sm text-gray-600">
          Home base: {profile.homeBaseCity}, {profile.homeBaseState}
          <br />
          Alert radius: {profile.alertRadiusMiles} miles
          <br />
          Escort positions: {positionLabels || "none selected"}
        </p>
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
