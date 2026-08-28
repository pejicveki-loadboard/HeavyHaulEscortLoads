import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MAX_ATTEMPTS } from "@/lib/load-matching";
import { AlertSendStatus } from "@/generated/prisma/enums";
import { PAGE_SIZE, parseTableParams, pageLink } from "@/lib/admin-table-params";

// "Permanently failed" isn't a stored status of its own -- it's a LoadAlert
// stuck at status=failed once it's used up its one retry. See MAX_ATTEMPTS
// in load-matching.ts, the single source of truth for that threshold.
const permanentlyFailedWhere = {
  status: AlertSendStatus.failed,
  attempts: { gte: MAX_ATTEMPTS },
} as const;

export default async function AdminFailedAlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const basePath = "/admin/failed-alerts";
  const t = parseTableParams(sp, "fa", "sentAt");

  const [total, rows] = await Promise.all([
    prisma.loadAlert.count({ where: permanentlyFailedWhere }),
    prisma.loadAlert.findMany({
      where: permanentlyFailedWhere,
      include: {
        load: { select: { originCity: true, originState: true, destinationCity: true, destinationState: true } },
        searchLocation: {
          select: {
            label: true,
            city: true,
            state: true,
            profile: { select: { companyName: true } },
          },
        },
      },
      orderBy: { sentAt: "desc" },
      skip: (t.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold text-brand-text">Permanently failed alerts ({total})</h1>
      <p className="mb-3 text-sm text-brand-muted">
        Alerts that exhausted both the initial attempt and the one retry (see load-matching.ts) --
        that driver never got notified about this load on this channel.
      </p>
      <div className="overflow-x-auto rounded border border-brand-border bg-brand-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-brand-text">
              <th className="p-2">Load</th>
              <th className="p-2">Search location</th>
              <th className="p-2">Channel</th>
              <th className="p-2">Attempts</th>
              <th className="p-2">First attempted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-brand-border text-brand-text">
                <td className="p-2">
                  {row.load.originCity}, {row.load.originState} &rarr; {row.load.destinationCity},{" "}
                  {row.load.destinationState}
                </td>
                <td className="p-2">
                  {row.searchLocation.profile.companyName} --{" "}
                  {row.searchLocation.label || `${row.searchLocation.city}, ${row.searchLocation.state}`}
                </td>
                <td className="p-2 uppercase">{row.channel}</td>
                <td className="p-2">{row.attempts}</td>
                <td className="p-2">{row.sentAt.toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-2 text-brand-muted">
                  No permanently-failed alerts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex gap-3 text-sm text-brand-muted">
        <span>
          Page {t.page} of {totalPages}
        </span>
        {t.page > 1 && (
          <Link
            href={pageLink(basePath, sp, "fa", t.page - 1)}
            className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
          >
            Previous
          </Link>
        )}
        {t.page < totalPages && (
          <Link
            href={pageLink(basePath, sp, "fa", t.page + 1)}
            className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
