import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [loadManagerProfile, pilotCarProfile] = await Promise.all([
    prisma.loadManagerProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.pilotCarProfile.findUnique({ where: { userId: session.user.id } }),
  ]);

  if (loadManagerProfile && pilotCarProfile) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-2 text-2xl font-semibold">What do you need?</h1>
      <p className="mb-6 text-gray-600">
        You can add the other one later from your account settings.
      </p>
      <OnboardingForm
        hasLoadManagerProfile={!!loadManagerProfile}
        hasPilotCarProfile={!!pilotCarProfile}
      />
    </main>
  );
}
