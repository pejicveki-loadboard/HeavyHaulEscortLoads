import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/sign-out-button";

// Bare-bones placeholder — role-aware dashboard shells and the nav
// role-switcher land in Week 1 Day 3-4 per PHASE1_PLAN.md. This just
// closes the loop after signup/onboarding for now.
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [loadManagerProfile, pilotCarProfile] = await Promise.all([
    prisma.loadManagerProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.pilotCarProfile.findUnique({ where: { userId: session.user.id } }),
  ]);

  if (!loadManagerProfile && !pilotCarProfile) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="mb-4 text-gray-600">Signed in as {session.user.email}</p>

      <ul className="flex flex-col gap-3">
        {loadManagerProfile && (
          <li className="rounded border border-gray-300 p-3">
            <strong>Load Manager</strong> — {loadManagerProfile.companyName}
          </li>
        )}
        {pilotCarProfile && (
          <li className="rounded border border-gray-300 p-3">
            <strong>Pilot Car</strong> — {pilotCarProfile.companyName}
            <br />
            <span className="text-sm text-gray-600">
              Status: {pilotCarProfile.subscriptionStatus}
              {pilotCarProfile.trialEndsAt &&
                ` (trial ends ${pilotCarProfile.trialEndsAt.toLocaleDateString()})`}
            </span>
          </li>
        )}
      </ul>
    </main>
  );
}
