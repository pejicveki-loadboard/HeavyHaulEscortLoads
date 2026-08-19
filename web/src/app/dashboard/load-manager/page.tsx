import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoadList, type LoadRow } from "@/components/load-list";

export default async function LoadManagerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.loadManagerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard/add-load-manager");

  const [loads, alertsSentCount] = await Promise.all([
    prisma.load.findMany({
      where: { postedById: profile.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loadAlert.count({ where: { load: { postedById: profile.id } } }),
  ]);

  const loadRows: LoadRow[] = loads.map((load) => ({
    id: load.id,
    originCity: load.originCity,
    originState: load.originState,
    destinationCity: load.destinationCity,
    destinationState: load.destinationState,
    date: load.date.toISOString(),
    escortPositions: load.escortPositions,
    weightLbs: load.weightLbs,
    rate: load.rate ? load.rate.toNumber() : null,
    rateUnit: load.rateUnit,
    status: load.status,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Load Manager Dashboard</h1>
        <p className="text-gray-600">
          {profile.companyName} ·{" "}
          <Link href="/dashboard/load-manager/edit" className="underline">
            Edit profile
          </Link>
        </p>
      </div>

      <section className="rounded border border-gray-300 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Your loads</h2>
          <Link
            href="/dashboard/load-manager/post"
            className="rounded bg-black px-3 py-1.5 text-sm text-white"
          >
            + Post a load
          </Link>
        </div>
        <LoadList loads={loadRows} />
      </section>

      <section className="rounded border border-gray-300 p-4">
        <h2 className="mb-2 font-semibold">Notifications sent</h2>
        <p className="text-sm text-gray-600">{alertsSentCount} pilot car alerts sent so far.</p>
      </section>
    </div>
  );
}
