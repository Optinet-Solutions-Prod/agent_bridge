import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserSearch } from "lucide-react";
import { LeadRow } from "@/components/lead-row";
import { LeadsTabs } from "@/components/leads-tabs";
import { MobileCollapse } from "@/components/mobile-collapse";
import { Pagination, SortSelect, applyOrderParam, readTableParams, type SortDir } from "@/components/table-controls";
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/format";
import type {
  LeadStatus,
  OwnerLeadOverview,
  OwnerLeadWithTracking,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Portal listings" };

const SORTS = {
  newest: { column: "source_checked_on", defaultDir: "desc" },
  price: { column: "price_eur", defaultDir: "asc" },
  size: { column: "size_sqm", defaultDir: "desc" },
  area: { column: "area", defaultDir: "asc" },
} as const satisfies Record<string, { column: string; defaultDir: SortDir }>;
type SortKey = keyof typeof SORTS;
const SORT_OPTIONS: { key: SortKey; dir: SortDir; label: string }[] = [
  { key: "newest", dir: "desc", label: "Newest" },
  { key: "price", dir: "asc", label: "Price, low to high" },
  { key: "price", dir: "desc", label: "Price, high to low" },
  { key: "size", dir: "desc", label: "Largest" },
  { key: "area", dir: "asc", label: "Area A–Z" },
];
type Param = string | string[] | undefined;
const first = (v: Param) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, Param>>;
}) {
  const params = applyOrderParam(await searchParams);
  const { supabase, agent } = await requireAgent();
  const { sort, dir, size, page, isDefault } = readTableParams<SortKey>(params, SORTS, "newest");

  const offer =
    first(params.offer) === "rent"
      ? "rent"
      : first(params.offer) === "sale"
        ? "sale"
        : "";
  const area = first(params.area);
  const typology = first(params.typology).toUpperCase();
  const min = Number(first(params.min)) || null;
  const max = Number(first(params.max)) || null;
  const q = first(params.q).trim();
  const status = (LEAD_STATUSES as string[]).includes(first(params.status))
    ? (first(params.status) as LeadStatus)
    : "";

  // My tracking rows (small: one per lead I've touched) drive the status filter and the counters.
  const [{ data: trackingRows, error: trackingError }, overviewRes] =
    await Promise.all([
      supabase
        .from("owner_lead_tracking")
        .select("lead_id, status")
        .eq("agent_id", agent.id),
      supabase.rpc("owner_lead_overview"),
    ]);
  const needsMigration =
    !!trackingError &&
    (trackingError.code === "PGRST205" || trackingError.code === "42P01");
  const tracking = (trackingRows ?? []) as {
    lead_id: string;
    status: LeadStatus;
  }[];
  const overview = (overviewRes.data ?? null) as OwnerLeadOverview | null;

  let query = supabase
    .from("owner_leads")
    .select("*, owner_lead_tracking(status, notes, updated_at)", {
      count: "exact",
    })
    .order(SORTS[sort].column, { ascending: dir === "asc", nullsFirst: false })
    .order("imported_at", { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (offer) query = query.eq("offer", offer);
  if (area) query = query.eq("area", area);
  if (typology) query = query.eq("typology", typology);
  if (min) query = query.gte("price_eur", min);
  if (max) query = query.lte("price_eur", max);
  if (q)
    query = query.or(
      `listing_id.ilike.%${q}%,area.ilike.%${q}%,advertiser_evidence.ilike.%${q}%`,
    );
  if (status === "new") {
    const touched = tracking.map((t) => t.lead_id);
    if (touched.length) query = query.not("id", "in", `(${touched.join(",")})`);
  } else if (status) {
    const ids = tracking
      .filter((t) => t.status === status)
      .map((t) => t.lead_id);
    query = ids.length
      ? query.in("id", ids)
      : query.in("id", ["00000000-0000-0000-0000-000000000000"]);
  }
  const { data, count } = needsMigration ? { data: [], count: 0 } : await query;
  const leads = (data ?? []) as OwnerLeadWithTracking[];
  const total = count ?? 0;

  const counters = LEAD_STATUSES.map((s) => ({
    status: s,
    n:
      s === "new"
        ? Math.max((overview?.total ?? 0) - tracking.length, 0)
        : tracking.filter((t) => t.status === s).length,
  }));

  const href = (overrides: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    const current: Record<string, string> = {
      offer,
      area,
      typology,
      min: min ? String(min) : "",
      max: max ? String(max) : "",
      q,
      status,
      sort: isDefault ? "" : sort,
      dir: isDefault ? "" : dir,
      size: size === 50 ? "" : String(size),
      page: page > 1 ? String(page) : "",
    };
    for (const [k, v] of Object.entries({ ...current, ...overrides }))
      if (v !== null && v !== "" && v !== undefined) p.set(k, String(v));
    const s = p.toString();
    return s ? `/leads/listings?${s}` : "/leads/listings";
  };

  return (
    <>
      <PageHeader
        title="Owner leads"
        description={
          overview && overview.total > 0
            ? `${overview.total} portal listings that say they are placed by private owners, across ${overview.areas} areas${overview.checked_on ? `, last checked ${formatDate(overview.checked_on)}` : ""}. The portals hide the owner, so identity is not verified; open the listing and judge.`
            : "Listings placed directly by private owners, supplied to the network as data. Each agent keeps their own status and notes."
        }
      />

      <LeadsTabs active="listings" />

      {needsMigration && (
        <Card className="mb-6 border-amber-300 bg-amber-50/80">
          <CardBody className="text-sm text-amber-900">
            <p className="font-semibold">One database step is missing.</p>
            <p className="mt-1">
              In Supabase open <strong>SQL Editor</strong>, paste{" "}
              <code className="rounded bg-amber-100 px-1">
                supabase/migrations/0004_owner_leads.sql
              </code>{" "}
              and run it, then import a file with{" "}
              <code className="rounded bg-amber-100 px-1">
                node scripts/import-owner-leads.mjs &lt;file.xlsx&gt;
              </code>
              .
            </p>
          </CardBody>
        </Card>
      )}

      {/* My pipeline */}
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link
          href={href({ status: null, page: null })}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition",
            !status
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
          )}
        >
          All{" "}
          <span
            className={cn(
              "text-xs tabular-nums",
              !status ? "text-white/70" : "text-slate-500",
            )}
          >
            {overview?.total ?? 0}
          </span>
        </Link>
        {counters.map((c) => (
          <Link
            key={c.status}
            href={href({ status: c.status, page: null })}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition",
              status === c.status
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            )}
          >
            {LEAD_STATUS_LABEL[c.status]}{" "}
            <span
              className={cn(
                "text-xs tabular-nums",
                status === c.status ? "text-white/70" : "text-slate-500",
              )}
            >
              {c.n}
            </span>
          </Link>
        ))}
      </div>

      {/* Filters: behind a button on phones, always visible from sm up */}
      <MobileCollapse
        label={
          [offer, area, typology, min, max, q].some(Boolean)
            ? "Filters (active)"
            : "Filters"
        }
        openLabel="Hide filters"
        className="mb-6"
        panelClassName="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <form method="get" className="contents">
          {status && <input type="hidden" name="status" value={status} />}
          {size !== 50 && <input type="hidden" name="size" value={size} />}
          <select name="offer" defaultValue={offer} aria-label="Sale or rent">
            <option value="">Sale and rent</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
          <select name="area" defaultValue={area} aria-label="Area">
            <option value="">Any area</option>
            {(overview?.by_area ?? []).map((a) => (
              <option key={`${a.district}-${a.area}`} value={a.area}>
                {a.area} ({a.listings})
              </option>
            ))}
          </select>
          <select name="typology" defaultValue={typology} aria-label="Typology">
            <option value="">Any typology</option>
            {["T0", "T1", "T2", "T3", "T4", "T5"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input
            name="min"
            type="number"
            inputMode="numeric"
            placeholder="Min €"
            defaultValue={min ?? ""}
            min={0}
            step={1000}
            aria-label="Minimum price"
          />
          <input
            name="max"
            type="number"
            inputMode="numeric"
            placeholder="Max €"
            defaultValue={max ?? ""}
            min={0}
            step={1000}
            aria-label="Maximum price"
          />
          <input
            name="q"
            type="search"
            placeholder="Listing id or words"
            defaultValue={q}
            aria-label="Search"
          />
          <SortSelect options={SORT_OPTIONS} sort={sort} dir={dir} />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" /> Filter
          </Button>
        </form>
      </MobileCollapse>

      {leads.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title={
            overview && overview.total > 0
              ? "No leads match these filters"
              : "No owner leads imported yet"
          }
          description={
            overview && overview.total > 0
              ? "Widen the price range, clear the area, or pick another status."
              : "Import a spreadsheet of private-owner listings with scripts/import-owner-leads.mjs and they appear here for every agent."
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {total} listing{total === 1 ? "" : "s"} · sorted by{" "}
            {SORT_OPTIONS.find((o) => o.key === sort && o.dir === dir)?.label.toLowerCase()}
            {overview?.median_sale_eur_sqm && !offer ? (
              <>
                {" "}
                · median asking{" "}
                {formatPrice(Math.round(overview.median_sale_eur_sqm))} per m²
                for sale
              </>
            ) : null}
          </p>
          <ul className="space-y-3">
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </ul>
          <Pagination page={page} size={size} total={total} href={href} />
        </>
      )}
    </>
  );
}
