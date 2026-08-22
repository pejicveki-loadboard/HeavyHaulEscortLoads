import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard-nav";
import { VerifyEmailBanner } from "@/components/verify-email-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, loadManagerProfile, pilotCarProfile] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.loadManagerProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.pilotCarProfile.findUnique({ where: { userId: session.user.id } }),
  ]);

  if (!loadManagerProfile && !pilotCarProfile) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <DashboardNav
        email={session.user.email ?? ""}
        hasLoadManagerProfile={!!loadManagerProfile}
        hasPilotCarProfile={!!pilotCarProfile}
      />
      {user && !user.emailVerifiedAt && <VerifyEmailBanner />}
      {children}
    </main>
  );
}
