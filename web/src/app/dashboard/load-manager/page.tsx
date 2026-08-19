import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function LoadManagerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.loadManagerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard/add-load-manager");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Load Manager Dashboard</h1>
        <p className="text-gray-600">{profile.companyName}</p>
      </div>

      <section className="rounded border border-gray-300 p-4">
        <h2 className="mb-2 font-semibold">Your loads</h2>
        <p className="text-sm text-gray-600">
          You haven&apos;t posted any loads yet. Posting a load is coming in Week 2.
        </p>
      </section>

      <section className="rounded border border-gray-300 p-4">
        <h2 className="mb-2 font-semibold">Notifications sent</h2>
        <p className="text-sm text-gray-600">0 pilot car alerts sent so far.</p>
      </section>
    </div>
  );
}
