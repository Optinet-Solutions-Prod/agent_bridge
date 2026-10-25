import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";
export const PAGE_SIZES = [25, 50, 100] as const;

type Param = string | string[] | undefined;
const one = (v: Param) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Read sort, direction, page and page size from the URL, falling back to the
 * table's default sort. Unknown sort keys are ignored.
 */
export function readTableParams<K extends string>(
  params: Record<string, Param>,
  sorts: Record<K, { defaultDir: SortDir }>,
  fallback: K,
) {
  const key = (one(params.sort) in sorts ? one(params.sort) : fallback) as K;
  const dir: SortDir = one(params.dir) === "asc" ? "asc" : one(params.dir) === "desc" ? "desc" : sorts[key].defaultDir;
  const size = (PAGE_SIZES as readonly number[]).includes(Number(one(params.size))) ? Number(one(params.size)) : 50;
  const page = Math.max(1, Number(one(params.page)) || 1);
  return { sort: key, dir, size, page, isDefault: key === fallback && dir === sorts[fallback].defaultDir };
}

/** A clickable column header: first click sorts by the column's natural direction, the next click flips it. */
export function SortHeader({
  label,
  sortKey,
  current,
  dir,
  defaultDir,
  href,
  className,
}: {
  label: string;
  sortKey: string;
  current: string;
  dir: SortDir;
  defaultDir: SortDir;
  href: (o: Record<string, string | number | null>) => string;
  className?: string;
}) {
  const active = current === sortKey;
  const next: SortDir = active ? (dir === "asc" ? "desc" : "asc") : defaultDir;
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={cn("px-4 py-3", className)} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <Link
        href={href({ sort: sortKey, dir: next, page: null })}
        prefetch={false}
        scroll={false}
        className={cn("group inline-flex items-center gap-1 rounded transition-colors hover:text-slate-900", active && "text-slate-900")}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "opacity-100" : "opacity-40 group-hover:opacity-80")} />
      </Link>
    </th>
  );
}

/** Plain header for columns that can't be sorted. */
export function PlainHeader({ label, className }: { label: string; className?: string }) {
  return <th className={cn("px-4 py-3", className)}>{label}</th>;
}

/** Sort options for the filter form (phones have no column headers). Value is "key:dir". */
export function SortSelect({ options, sort, dir }: { options: { key: string; dir: SortDir; label: string }[]; sort: string; dir: SortDir }) {
  return (
    <select name="order" defaultValue={`${sort}:${dir}`} aria-label="Sort">
      {options.map((o) => (
        <option key={`${o.key}:${o.dir}`} value={`${o.key}:${o.dir}`}>
          Sort: {o.label}
        </option>
      ))}
    </select>
  );
}

/** Merge the filter form's "order" field into sort and dir. */
export function applyOrderParam(params: Record<string, Param>) {
  const order = one(params.order);
  if (!order.includes(":")) return params;
  const [sort, dir] = order.split(":");
  return { ...params, sort, dir };
}

function pageList(page: number, pages: number): (number | "…")[] {
  const set = new Set([1, pages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((p) => set.add(p));
  const list = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  list.forEach((p, i) => {
    if (i && p - list[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const fmt = (n: number) => n.toLocaleString("en-GB");

const BTN = "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-medium tabular-nums transition";
const IDLE = "border-slate-200 bg-white text-slate-700 hover:border-slate-300";
const OFF = "pointer-events-none border-slate-100 bg-slate-50 text-slate-300";

function PageNav({ href, label, children, disabled }: { href: string; label: string; children: React.ReactNode; disabled: boolean }) {
  return disabled ? (
    <span aria-disabled className={cn(BTN, OFF)} aria-label={label}>
      {children}
    </span>
  ) : (
    <Link href={href} prefetch={false} aria-label={label} className={cn(BTN, IDLE)}>
      {children}
    </Link>
  );
}

/** Numbered pagination with first/last, a page-size switch and the current range. */
export function Pagination({
  page,
  size,
  total,
  approximate,
  href,
}: {
  page: number;
  size: number;
  total: number;
  approximate?: boolean;
  href: (o: Record<string, string | number | null>) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(page * size, total);
  return (
    <nav aria-label="Pages" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        {fmt(from)}–{fmt(to)} of {approximate ? "about " : ""}
        {fmt(total)}
      </p>

      <div className="flex items-center gap-1">
        <PageNav href={href({ page: null })} label="First page" disabled={page <= 1}>
          <ChevronsLeft className="h-4 w-4" />
        </PageNav>
        <PageNav href={href({ page: page - 1 > 1 ? page - 1 : null })} label="Previous page" disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </PageNav>
        <div className="hidden items-center gap-1 sm:flex">
          {pageList(page, pages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-sm text-slate-400">
                …
              </span>
            ) : (
              <Link
                key={p}
                prefetch={false}
                href={href({ page: p === 1 ? null : p })}
                aria-current={p === page ? "page" : undefined}
                className={cn(BTN, p === page ? "border-slate-900 bg-slate-900 text-white" : IDLE)}
              >
                {fmt(p)}
              </Link>
            ),
          )}
        </div>
        <span className="px-2 text-sm tabular-nums text-slate-600 sm:hidden">
          {fmt(page)} / {fmt(pages)}
        </span>
        <PageNav href={href({ page: page + 1 })} label="Next page" disabled={page >= pages}>
          <ChevronRight className="h-4 w-4" />
        </PageNav>
        <PageNav href={href({ page: pages })} label="Last page" disabled={page >= pages}>
          <ChevronsRight className="h-4 w-4" />
        </PageNav>
      </div>

      <div className="flex items-center gap-1 text-sm text-slate-500">
        <span className="mr-1">Per page</span>
        {PAGE_SIZES.map((s) => (
          <Link
            key={s}
            prefetch={false}
            href={href({ size: s === 50 ? null : s, page: null })}
            aria-current={s === size ? "true" : undefined}
            className={cn("rounded-md px-2 py-1 tabular-nums transition", s === size ? "bg-slate-900 text-white" : "hover:bg-slate-100 hover:text-slate-800")}
          >
            {s}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------ Skeletons for streamed sections */

const bar = "animate-pulse rounded-lg bg-slate-200/70";

/** Placeholder for the stats, notice, status chips and filters while they load. */
export function SummarySkeleton({ stats = 4 }: { stats?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading summary">
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className={cn(bar, "h-[104px] rounded-2xl")} />
        ))}
      </div>
      <div className="mb-5 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(bar, "h-9 w-24 rounded-full")} />
        ))}
      </div>
      <div className={cn(bar, "mb-6 h-[72px] rounded-2xl")} />
    </div>
  );
}

/** Placeholder rows shaped like the results table (cards on phones). */
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading results">
      <div className={cn(bar, "mb-3 h-4 w-56")} />
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white md:block">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className={cn(bar, "h-3 w-1/2")} />
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-4 border-b border-slate-100 px-4 py-4 last:border-0" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="space-y-2">
                <div className={cn(bar, "h-3.5", c === 0 ? "w-4/5" : "w-3/5")} />
                <div className={cn(bar, "h-3 w-2/5")} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(bar, "h-36 rounded-2xl")} />
        ))}
      </div>
    </div>
  );
}
