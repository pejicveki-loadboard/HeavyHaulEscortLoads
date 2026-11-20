import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import { effectiveSubscriptionStatus, GRACE_PERIOD_DAYS } from "@/lib/subscription";
import { accessLabel } from "@/lib/access";
import { centralDateString, lastCoveredCentralDate } from "@/lib/central-date";
import { PAGE_SIZE, parseTableParams, sortLink, pageLink } from "@/lib/admin-table-params";
import { PilotCarAccessTable, type PilotCarAccessRow } from "./pilot-car-access-table";

const LM_SORT_FIELDS = ["companyName", "createdAt"] as const;
const PC_SORT_FIELDS = ["companyName", "createdAt", "trialEndsAt"] as const;

const ACCESS_FILTERS = ["all", "on", "off", "paid", "expired", "granted"] as const;
type AccessFilter = (typeof ACCESS_FILTERS)[number];
const ACCESS_FILTER_LABEL: Record<AccessFilter, string> = {
  all: "All",
  on: "On",
  off: "Off",
  paid: "Paid",
  expired: "Expired",
  granted: "Granted",
};

// On/Off is the admin switch; Paid/Expired are the underlying billing state
// (independent of the promo, so admins can still see who actually pays);
// Granted is an unexpired per-profile freeAccessUntil. Mirrors
// hasLoadBoardAccess()/effectiveSubscriptionStatus() semantics.
function accessFilterWhere(filter: AccessFilter, now: Date): Prisma.PilotCarProfileWhereInput {
  const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  switch (filter) {
    case "on":
      return { accessEnabled: true };
    case "off":
      return { accessEnabled: false };
    case "paid":
      return {
        OR: [
          { subscriptionStatus: SubscriptionStatus.active },
          { subscriptionStatus: SubscriptionStatus.past_due, pastDueSince: { gt: graceCutoff } },
        ],
      };
    case "expired":
      return {
        OR: [
          { subscriptionStatus: { in: [SubscriptionStatus.none, SubscriptionStatus.expired] } },
          {
            subscriptionStatus: SubscriptionStatus.trialing,
            OR: [{ trialEndsAt: null }, { trialEndsAt: { lte: now } }],
          },
          {
            subscriptionStatus: SubscriptionStatus.past_due,
            OR: [{ pastDueSince: null }, { pastDueSince: { lte: graceCutoff } }],
          },
        ],
      };
    case "granted":
      return { freeAccessUntil: { gt: now } };
    default:
      return {};
  }
}

function safeSort<T extends readonly string[]>(sort: string, allowed: T, fallback: T[number]) {
  return (allowed as readonly string[]).includes(sort) ? (sort as T[number]) : fallback;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const basePath = "/admin/users";

  const lm = parseTableParams(sp, "lm", "createdAt");
  const lmSort = safeSort(lm.sort, LM_SORT_FIELDS, "createdAt");
  const lmWhere = lm.q
    ? {
        OR: [
          { companyName: { contains: lm.q, mode: "insensitive" as const } },
          { user: { email: { contains: lm.q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const now = new Date();
  const pc = parseTableParams(sp, "pc", "createdAt");
  const pcSort = safeSort(pc.sort, PC_SORT_FIELDS, "createdAt");
  const pcAccess: AccessFilter = ACCESS_FILTERS.includes(sp.pcAccess as AccessFilter)
    ? (sp.pcAccess as AccessFilter)
    : "all";
  const pcWhere: Prisma.PilotCarProfileWhereInput = {
    AND: [
      pc.q
        ? {
            OR: [
              { companyName: { contains: pc.q, mode: "insensitive" as const } },
              { user: { email: { contains: pc.q, mode: "insensitive" as const } } },
            ],
          }
        : {},
      accessFilterWhere(pcAccess, now),
    ],
  };

  const [lmTotal, lmRows, pcTotal, pcRows] = await Promise.all([
    prisma.loadManagerProfile.count({ where: lmWhere }),
    prisma.loadManagerProfile.findMany({
      where: lmWhere,
      include: { user: { select: { email: true } } },
      orderBy: { [lmSort]: lm.dir },
      skip: (lm.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.pilotCarProfile.count({ where: pcWhere }),
    prisma.pilotCarProfile.findMany({
      where: pcWhere,
      include: { user: { select: { email: true } } },
      orderBy: { [pcSort]: pc.dir },
      skip: (pc.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const lmPages = Math.max(1, Math.ceil(lmTotal / PAGE_SIZE));
  const pcPages = Math.max(1, Math.ceil(pcTotal / PAGE_SIZE));

  const pcAccessRows: PilotCarAccessRow[] = pcRows.map((row) => ({
    id: row.id,
    companyName: row.companyName,
    email: row.user.email,
    phone: row.phone,
    signedUp: row.createdAt.toLocaleDateString(),
    trialStarted: row.trialStartedAt?.toLocaleDateString() ?? "—",
    trialEnds: row.trialEndsAt?.toLocaleDateString() ?? "—",
    status: effectiveSubscriptionStatus(row, now),
    paidStarted: row.paidStartedAt?.toLocaleDateString() ?? "—",
    accessEnabled: row.accessEnabled,
    accessLabel: accessLabel(row, now),
    freeUntilDate: row.freeAccessUntil ? lastCoveredCentralDate(row.freeAccessUntil) : null,
    accessNote: row.accessNote,
    accessUpdated: row.accessUpdatedAt?.toLocaleDateString() ?? null,
  }));

  // Filter tab links: keep search/sort, reset to page 1.
  const filterHref = (f: AccessFilter) => {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(sp)) {
      if (typeof val === "string" && key !== "pcAccess" && key !== "pcPage") params.set(key, val);
    }
    if (f !== "all") params.set("pcAccess", f);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="mb-3 text-2xl font-semibold text-brand-text">
          Load Manager profiles ({lmTotal})
        </h1>
        <form method="get" className="mb-3">
          <input type="hidden" name="pcQ" value={pc.q} />
          <input
            type="text"
            name="lmQ"
            defaultValue={lm.q}
            placeholder="Search company or email..."
            className="rounded border border-brand-border bg-brand-panel px-3 py-1.5 text-sm text-brand-text"
          />
        </form>
        <div className="overflow-x-auto rounded border border-brand-border bg-brand-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-text">
                <th className="p-2">
                  <Link href={sortLink(basePath, sp, "lm", "companyName", lm)}>Company</Link>
                </th>
                <th className="p-2">Email</th>
                <th className="p-2">Phone</th>
                <th className="p-2">
                  <Link href={sortLink(basePath, sp, "lm", "createdAt", lm)}>Signed up</Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {lmRows.map((row) => (
                <tr key={row.id} className="border-b border-brand-border text-brand-text">
                  <td className="p-2">{row.companyName}</td>
                  <td className="p-2">{row.user.email}</td>
                  <td className="p-2">{row.phone}</td>
                  <td className="p-2">{row.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
              {lmRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-2 text-brand-muted">
                    No matching Load Manager profiles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex gap-3 text-sm text-brand-muted">
          <span>
            Page {lm.page} of {lmPages}
          </span>
          {lm.page > 1 && (
            <Link
              href={pageLink(basePath, sp, "lm", lm.page - 1)}
              className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
            >
              Previous
            </Link>
          )}
          {lm.page < lmPages && (
            <Link
              href={pageLink(basePath, sp, "lm", lm.page + 1)}
              className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
            >
              Next
            </Link>
          )}
        </div>
      </section>

      <section>
        <h1 className="mb-3 text-2xl font-semibold text-brand-text">
          Pilot Car profiles ({pcTotal})
        </h1>
        <form method="get" className="mb-3">
          <input type="hidden" name="lmQ" value={lm.q} />
          {pcAccess !== "all" && <input type="hidden" name="pcAccess" value={pcAccess} />}
          <input
            type="text"
            name="pcQ"
            defaultValue={pc.q}
            placeholder="Search company or email..."
            className="rounded border border-brand-border bg-brand-panel px-3 py-1.5 text-sm text-brand-text"
          />
        </form>
        <nav aria-label="Access filter" className="mb-3 flex flex-wrap gap-2 text-sm">
          {ACCESS_FILTERS.map((f) => (
            <Link
              key={f}
              href={filterHref(f)}
              aria-current={pcAccess === f ? "page" : undefined}
              className={`rounded border px-3 py-1 transition-colors duration-150 ${
                pcAccess === f
                  ? "border-brand-accent bg-brand-accent text-brand-accent-text"
                  : "border-brand-border text-brand-text hover:border-brand-accent"
              }`}
            >
              {ACCESS_FILTER_LABEL[f]}
            </Link>
          ))}
        </nav>
        <PilotCarAccessTable
          rows={pcAccessRows}
          today={centralDateString(now)}
          sortHrefs={{
            companyName: sortLink(basePath, sp, "pc", "companyName", pc),
            createdAt: sortLink(basePath, sp, "pc", "createdAt", pc),
            trialEndsAt: sortLink(basePath, sp, "pc", "trialEndsAt", pc),
          }}
        />
        <div className="mt-2 flex gap-3 text-sm text-brand-muted">
          <span>
            Page {pc.page} of {pcPages}
          </span>
          {pc.page > 1 && (
            <Link
              href={pageLink(basePath, sp, "pc", pc.page - 1)}
              className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
            >
              Previous
            </Link>
          )}
          {pc.page < pcPages && (
            <Link
              href={pageLink(basePath, sp, "pc", pc.page + 1)}
              className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
            >
              Next
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
