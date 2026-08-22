import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { effectiveSubscriptionStatus } from "@/lib/subscription";
import { PAGE_SIZE, parseTableParams, sortLink, pageLink } from "@/lib/admin-table-params";

const LM_SORT_FIELDS = ["companyName", "createdAt"] as const;
const PC_SORT_FIELDS = ["companyName", "createdAt", "trialEndsAt"] as const;

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

  const pc = parseTableParams(sp, "pc", "createdAt");
  const pcSort = safeSort(pc.sort, PC_SORT_FIELDS, "createdAt");
  const pcWhere = pc.q
    ? {
        OR: [
          { companyName: { contains: pc.q, mode: "insensitive" as const } },
          { user: { email: { contains: pc.q, mode: "insensitive" as const } } },
        ],
      }
    : {};

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
              className="text-brand-accent underline"
            >
              Previous
            </Link>
          )}
          {lm.page < lmPages && (
            <Link
              href={pageLink(basePath, sp, "lm", lm.page + 1)}
              className="text-brand-accent underline"
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
          <input
            type="text"
            name="pcQ"
            defaultValue={pc.q}
            placeholder="Search company or email..."
            className="rounded border border-brand-border bg-brand-panel px-3 py-1.5 text-sm text-brand-text"
          />
        </form>
        <div className="overflow-x-auto rounded border border-brand-border bg-brand-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-text">
                <th className="p-2">
                  <Link href={sortLink(basePath, sp, "pc", "companyName", pc)}>Company</Link>
                </th>
                <th className="p-2">Email</th>
                <th className="p-2">Phone</th>
                <th className="p-2">
                  <Link href={sortLink(basePath, sp, "pc", "createdAt", pc)}>Signed up</Link>
                </th>
                <th className="p-2">Trial started</th>
                <th className="p-2">
                  <Link href={sortLink(basePath, sp, "pc", "trialEndsAt", pc)}>Trial ends</Link>
                </th>
                <th className="p-2">Status</th>
                <th className="p-2">Paid started</th>
              </tr>
            </thead>
            <tbody>
              {pcRows.map((row) => (
                <tr key={row.id} className="border-b border-brand-border text-brand-text">
                  <td className="p-2">{row.companyName}</td>
                  <td className="p-2">{row.user.email}</td>
                  <td className="p-2">{row.phone}</td>
                  <td className="p-2">{row.createdAt.toLocaleDateString()}</td>
                  <td className="p-2">{row.trialStartedAt?.toLocaleDateString() ?? "—"}</td>
                  <td className="p-2">{row.trialEndsAt?.toLocaleDateString() ?? "—"}</td>
                  <td className="p-2">{effectiveSubscriptionStatus(row)}</td>
                  <td className="p-2">{row.paidStartedAt?.toLocaleDateString() ?? "—"}</td>
                </tr>
              ))}
              {pcRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-2 text-brand-muted">
                    No matching Pilot Car profiles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex gap-3 text-sm text-brand-muted">
          <span>
            Page {pc.page} of {pcPages}
          </span>
          {pc.page > 1 && (
            <Link
              href={pageLink(basePath, sp, "pc", pc.page - 1)}
              className="text-brand-accent underline"
            >
              Previous
            </Link>
          )}
          {pc.page < pcPages && (
            <Link
              href={pageLink(basePath, sp, "pc", pc.page + 1)}
              className="text-brand-accent underline"
            >
              Next
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
