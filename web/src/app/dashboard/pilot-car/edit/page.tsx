import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PilotCarProfileForm } from "@/components/pilot-car-profile-form";

export default async function EditPilotCarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard/add-pilot-car");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/pilot-car" className="text-sm underline">
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit Pilot Car profile</h1>
      </div>
      <PilotCarProfileForm
        mode="edit"
        initialValues={{
          companyName: profile.companyName,
          phone: profile.phone,
          homeBaseCity: profile.homeBaseCity,
          homeBaseState: profile.homeBaseState,
          alertRadiusMiles: profile.alertRadiusMiles,
          escortPositions: profile.escortPositions,
        }}
      />
    </div>
  );
}
