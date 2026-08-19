import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PilotCarProfileForm } from "@/components/pilot-car-profile-form";

export default async function AddPilotCarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const existing = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) redirect("/dashboard/pilot-car");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Add Pilot Car access</h1>
        <p className="text-gray-600">Starts a 30-day free trial.</p>
      </div>
      <PilotCarProfileForm redirectTo="/dashboard/pilot-car" />
    </div>
  );
}
