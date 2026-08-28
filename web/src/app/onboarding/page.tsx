import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [loadManagerProfile, pilotCarProfile, user] = await Promise.all([
    prisma.loadManagerProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.pilotCarProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    }),
  ]);

  if (loadManagerProfile && pilotCarProfile) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-2 text-2xl font-semibold text-brand-text">What do you need?</h1>
      <p className="mb-6 text-brand-muted">
        You can add the other one later from your account settings.
      </p>
      <OnboardingForm
        hasLoadManagerProfile={!!loadManagerProfile}
        hasPilotCarProfile={!!pilotCarProfile}
        initialPhone={user?.phone ?? undefined}
      />
    </main>
  );
}
