import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoadManagerProfileForm } from "@/components/load-manager-profile-form";

export default async function EditLoadManagerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.loadManagerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard/add-load-manager");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/load-manager" className="text-sm text-brand-accent underline">
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-brand-text">Edit Load Manager profile</h1>
      </div>
      <LoadManagerProfileForm
        mode="edit"
        initialValues={{
          companyName: profile.companyName,
          phone: profile.phone,
          dotNumber: profile.dotNumber,
          mcNumber: profile.mcNumber,
        }}
      />
    </div>
  );
}
