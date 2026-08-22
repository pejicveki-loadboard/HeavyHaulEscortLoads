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
        <h1 className="text-2xl font-semibold text-brand-text">Load Manager Dashboard</h1>
        <p className="text-brand-muted">
          {profile.companyName} ·{" "}
          <Link href="/dashboard/load-manager/edit" className="text-brand-accent underline">
            Edit profile
          </Link>
        </p>
      </div>

      <section className="rounded border border-brand-border bg-brand-panel p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-brand-text">Your loads</h2>
          <Link
            href="/dashboard/load-manager/post"
            className="rounded bg-brand-accent px-3 py-1.5 text-sm text-brand-accent-text"
          >
            + Post a load
          </Link>
        </div>
        <LoadList loads={loadRows} />
      </section>

      <section className="rounded border border-brand-border bg-brand-panel p-4">
        <h2 className="mb-2 font-semibold text-brand-text">Notifications sent</h2>
        <p className="text-sm text-brand-muted">{alertsSentCount} pilot car alerts sent so far.</p>
      </section>
    </div>
  );
}
