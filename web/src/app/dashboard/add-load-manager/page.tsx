import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoadManagerProfileForm } from "@/components/load-manager-profile-form";

export default async function AddLoadManagerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const existing = await prisma.loadManagerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) redirect("/dashboard/load-manager");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Add Load Manager access</h1>
        <p className="text-brand-muted">Free, no subscription required.</p>
      </div>
      <LoadManagerProfileForm redirectTo="/dashboard/load-manager" />
    </div>
  );
}
