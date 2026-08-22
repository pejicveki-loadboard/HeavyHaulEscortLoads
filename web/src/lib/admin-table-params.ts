// Shared plain-URL search/sort/pagination parsing for the admin tables
// (Users' two tables, Loads). Each table prefixes its own params (e.g.
// "lm", "pc") so multiple tables can coexist on one page without clashing.
export const PAGE_SIZE = 25;

export function parseTableParams(
  searchParams: Record<string, string | string[] | undefined>,
  prefix: string,
  defaultSort: string
) {
  const get = (key: string) => {
    const val = searchParams[`${prefix}${key}`];
    return typeof val === "string" ? val : undefined;
  };

  const q = get("Q") ?? "";
  const sort = get("Sort") ?? defaultSort;
  const dir = get("Dir") === "asc" ? "asc" : "desc";
  const pageRaw = parseInt(get("Page") ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q, sort, dir, page } as const;
}

// href for a sortable column header: toggles direction if already sorted
// by that field, otherwise defaults to desc. Preserves the other table's
// params and this table's current q/page.
export function sortLink(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  prefix: string,
  field: string,
  current: { sort: string; dir: "asc" | "desc" }
) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (typeof val === "string") params.set(key, val);
  }
  params.set(`${prefix}Sort`, field);
  params.set(
    `${prefix}Dir`,
    current.sort === field && current.dir === "desc" ? "asc" : "desc"
  );
  return `${basePath}?${params.toString()}`;
}

export function pageLink(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  prefix: string,
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (typeof val === "string") params.set(key, val);
  }
  params.set(`${prefix}Page`, String(page));
  return `${basePath}?${params.toString()}`;
}
