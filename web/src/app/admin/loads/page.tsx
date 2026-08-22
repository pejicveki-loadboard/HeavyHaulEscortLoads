import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import { PAGE_SIZE, parseTableParams, sortLink, pageLink } from "@/lib/admin-table-params";

const SORT_FIELDS = ["date", "createdAt", "status"] as const;

function safeSort(sort: string) {
  return (SORT_FIELDS as readonly string[]).includes(sort) ? sort : "createdAt";
}

function positionLabels(positions: string[]) {
  return positions
    .map((p) => ESCORT_POSITIONS.find((pos) => pos.value === p)?.label ?? p)
    .join(", ");
}

export default async function AdminLoadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const basePath = "/admin/loads";
  const t = parseTableParams(sp, "l", "createdAt");
  const sort = safeSort(t.sort);

  const where = t.q
    ? {
        OR: [
          { originCity: { contains: t.q, mode: "insensitive" as const } },
          { originState: { contains: t.q, mode: "insensitive" as const } },
          { destinationCity: { contains: t.q, mode: "insensitive" as const } },
          { destinationState: { contains: t.q, mode: "insensitive" as const } },
          { postedBy: { companyName: { contains: t.q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.load.count({ where }),
    prisma.load.findMany({
      where,
      include: { postedBy: { select: { companyName: true, id: true } } },
      orderBy: { [sort]: t.dir },
      skip: (t.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold">Loads ({total})</h1>
      <form method="get" className="mb-3">
        <input
          type="text"
          name="lQ"
          defaultValue={t.q}
          placeholder="Search origin, destination, or company..."
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="p-2">Origin &rarr; Destination</th>
              <th className="p-2">
                <Link href={sortLink(basePath, sp, "l", "date", t)}>Date</Link>
              </th>
              <th className="p-2">Escort positions</th>
              <th className="p-2">
                <Link href={sortLink(basePath, sp, "l", "status", t)}>Status</Link>
              </th>
              <th className="p-2">Posted by</th>
              <th className="p-2">
                <Link href={sortLink(basePath, sp, "l", "createdAt", t)}>Created</Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                <td className="p-2">
                  {row.originCity}, {row.originState} &rarr; {row.destinationCity},{" "}
                  {row.destinationState}
                </td>
                <td className="p-2">{row.date.toLocaleDateString()}</td>
                <td className="p-2">{positionLabels(row.escortPositions)}</td>
                <td className="p-2">{row.status}</td>
                <td className="p-2">{row.postedBy.companyName}</td>
                <td className="p-2">{row.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-2 text-gray-600">
                  No matching loads.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex gap-3 text-sm">
        <span>
          Page {t.page} of {totalPages}
        </span>
        {t.page > 1 && (
          <Link href={pageLink(basePath, sp, "l", t.page - 1)} className="underline">
            Previous
          </Link>
        )}
        {t.page < totalPages && (
          <Link href={pageLink(basePath, sp, "l", t.page + 1)} className="underline">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
