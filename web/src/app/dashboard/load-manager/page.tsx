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

  const openCount = loads.filter((load) => load.status === "open").length;
  // Interim approximation: "loads currently covered that were posted this
  // calendar month" -- not the same as "marked covered this month", since
  // Load has no coveredAt/updatedAt timestamp to track the actual status
  // transition. See claude/design-handoff-notes.md entry 2 for the
  // recommended follow-up (add a nullable coveredAt column, set it in the
  // PATCH /api/loads/[id] handler) once there's a session with DB access to
  // run the migration.
  const now = new Date();
  const coveredThisMonthCount = loads.filter(
    (load) =>
      load.status === "covered" &&
      load.createdAt.getFullYear() === now.getFullYear() &&
      load.createdAt.getMonth() === now.getMonth(),
  ).length;

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

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border border-brand-border bg-brand-panel p-4">
          <div className="text-3xl font-bold text-brand-accent">{openCount}</div>
          <div className="mt-1 text-xs text-brand-muted">Open loads</div>
        </div>
        <div className="rounded border border-brand-border bg-brand-panel p-4">
          <div className="text-3xl font-bold text-brand-text">{coveredThisMonthCount}</div>
          <div className="mt-1 text-xs text-brand-muted">Covered this month</div>
        </div>
        <div className="rounded border border-brand-border bg-brand-panel p-4">
          <div className="text-3xl font-bold text-brand-text">{alertsSentCount}</div>
          <div className="mt-1 text-xs text-brand-muted">Pilot car alerts sent</div>
        </div>
      </div>

      <section className="rounded border border-brand-border bg-brand-panel p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-brand-text">Your loads</h2>
          <Link
            href="/dashboard/load-manager/post"
            className="rounded bg-brand-accent px-3 py-1.5 text-sm text-brand-accent-text transition-all duration-150 hover:bg-brand-accent-light active:scale-[0.97] active:bg-brand-accent-deep"
          >
            + Post a load
          </Link>
        </div>
        <LoadList loads={loadRows} />
      </section>
    </div>
  );
}
