import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// The layout already guarantees the user has at least one profile (and
// redirects to /onboarding otherwise) -- this just picks a default view.
export default async function DashboardIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const loadManagerProfile = await prisma.loadManagerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (loadManagerProfile) redirect("/dashboard/load-manager");

  redirect("/dashboard/pilot-car");
}
