import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoadForm } from "@/components/load-form";

export default async function PostLoadPage() {
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
        <h1 className="mt-2 text-2xl font-semibold text-brand-text">Post a load</h1>
      </div>
      <LoadForm mode="create" redirectTo="/dashboard/load-manager" />
    </div>
  );
}
