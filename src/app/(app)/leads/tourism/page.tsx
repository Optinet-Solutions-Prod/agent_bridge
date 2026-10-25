import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Building2, Globe, Hotel, Search, Users } from "lucide-react";
import { LeadsTabs, SourceLine } from "@/components/leads-tabs";
import { MobileCollapse } from "@/components/mobile-collapse";
import {
  Pagination,
  PlainHeader,
  SortHeader,
  SortSelect,
  SummarySkeleton,
  TableSkeleton,
  applyOrderParam,
  readTableParams,
  type SortDir,
} from "@/components/table-controls";
import { TourismCard, TourismTableRow } from "@/components/tourism-row";
import { Button, Card, CardBody, EmptyState, PageHeader, Stat } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { LEAD_STATUSES, LEAD_STATUS_LABEL, TOURISM_TYPE_LABEL } from "@/lib/constants";
import { getTourismOverview, getTourismTracking } from "@/lib/leads-data";
import { companyKey } from "@/lib/rnal";
import type { Company, LeadStatus, TourismPropertyWithTracking } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Owner leads · Tourist properties" };

const SORTS = {
  category: { column: "category", defaultDir: "desc" },
  rooms: { column: "rooms", defaultDir: "desc" },
  name: { column: "name", defaultDir: "asc" },
  location: { column: "municipality", defaultDir: "asc" },
  owner: { column: "owner_entity", defaultDir: "asc" },
  opened: { column: "opened_on", defaultDir: "desc" },
} as const satisfies Record<string, { column: string; defaultDir: SortDir }>;
type SortKey = keyof typeof SORTS;
const SORT_OPTIONS: { key: SortKey; dir: SortDir; label: string }[] = [
  { key: "category", dir: "desc", label: "Highest category" },
  { key: "rooms", dir: "desc", label: "Most rooms" },
  { key: "rooms", dir: "asc", label: "Fewest rooms" },
  { key: "name", dir: "asc", label: "Name A–Z" },
  { key: "location", dir: "asc", label: "Municipality A–Z" },
  { key: "owner", dir: "asc", label: "Owner A–Z" },
  { key: "opened", dir: "desc", label: "Recently licensed" },
];

type Param = string | string[] | undefined;
const first = (v: Param) => (Array.isArray(v) ? v[0] : v) ?? "";
const fmt = (n: number) => n.toLocaleString("en-GB");

function readFilters(raw: Record<string, Param>) {
  const params = applyOrderParam(raw);
  return {
    ...readTableParams<SortKey>(params, SORTS, "category"),
    district: first(params.district),
    type: first(params.type),
    q: first(params.q).trim().replace(/[,()%]/g, " "),
    status: (LEAD_STATUSES as string[]).includes(first(params.status)) ? (first(params.status) as LeadStatus) : "",
  };
}
type Filters = ReturnType<typeof readFilters>;

const makeHref = (f: Filters) => (overrides: Record<string, string | number | null>) => {
  const p = new URLSearchParams();
  const current: Record<string, string> = {
    district: f.district,
    type: f.type,
    q: f.q,
    status: f.status,
    sort: f.isDefault ? "" : f.sort,
    dir: f.isDefault ? "" : f.dir,
    size: f.size === 50 ? "" : String(f.size),
    page: f.page > 1 ? String(f.page) : "",
  };
  for (const [k, v] of Object.entries({ ...current, ...overrides })) if (v !== null && v !== "" && v !== undefined) p.set(k, String(v));
  const s = p.toString();
  return s ? `/leads/tourism?${s}` : "/leads/tourism";
};

export default async function TourismPage({ searchParams }: { searchParams: Promise<Record<string, Param>> }) {
  await requireAgent();
  const f = readFilters(await searchParams);
  return (
    <>
      <PageHeader
        title="Owner leads"
        description="Hotels, country houses, agritourism estates and manor houses from the tourist-property register, with the entity that owns each one and the one that runs it."
      />
      <LeadsTabs active="tourism" />
      <SourceLine
        label="Registo Nacional de Empreendimentos Turísticos (RNET)"
        publisher="Turismo de Portugal"
        links={[
          { href: "https://dadosabertos.turismodeportugal.pt/datasets/84912bbcfc7041eba5722a6f52b6bddf_0", text: "Open dataset" },
          { href: "https://rnt.turismodeportugal.pt/RNT/Pesquisa_ET.aspx", text: "Register search" },
          { href: "https://www.racius.com/", text: "Company facts: Racius" },
        ]}
      />
      <Suspense fallback={<SummarySkeleton />}>
        <Summary f={f} />
      </Suspense>
      <Suspense key={makeHref(f)({})} fallback={<TableSkeleton cols={6} />}>
        <Results f={f} />
      </Suspense>
    </>
  );
}

async function Summary({ f }: { f: Filters }) {
  const [{ overview, missing }, tracking] = await Promise.all([getTourismOverview(), getTourismTracking()]);
  const total = overview?.total ?? 0;
  const href = makeHref(f);
  const counters = LEAD_STATUSES.map((s) => ({
    status: s,
    n: s === "new" ? Math.max(total - tracking.length, 0) : tracking.filter((t) => t.status === s).length,
  }));
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition",
      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
    );
  const topTypes = (overview?.by_type ?? []).slice(0, 2);

  return (
    <>
      {missing && (
        <Card className="mb-6 border-amber-300 bg-amber-50/80">
          <CardBody className="text-sm text-amber-900">
            <p className="font-semibold">One database step is missing.</p>
            <p className="mt-1">
              Run <code className="rounded bg-amber-100 px-1">supabase/migrations/0007_sources.sql</code> in the Supabase SQL Editor, then{" "}
              <code className="rounded bg-amber-100 px-1">node scripts/import-open-data.mjs</code>.
            </p>
          </CardBody>
        </Card>
      )}

      {!missing && total > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Tourist properties" value={fmt(total)} hint={overview?.checked_on ? `Open data, checked ${formatDate(overview.checked_on)}` : "Whole country, open data"} icon={Hotel} tone="teal" />
          {topTypes.map((t) => (
            <Stat key={t.type} label={TOURISM_TYPE_LABEL[t.type] ?? t.type} value={fmt(t.n)} icon={Building2} />
          ))}
          <Stat label="Owner ≠ operator" value={fmt(overview?.owner_differs ?? 0)} hint={`${fmt(overview?.with_website ?? 0)} have a website`} icon={Users} />
        </div>
      )}

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href({ status: null, page: null })} prefetch={false} className={chip(!f.status)}>
          All <span className={cn("text-xs tabular-nums", !f.status ? "text-white/70" : "text-slate-500")}>{fmt(total)}</span>
        </Link>
        {counters.map((c) => (
          <Link key={c.status} href={href({ status: c.status, page: null })} prefetch={false} className={chip(f.status === c.status)}>
            {LEAD_STATUS_LABEL[c.status]} <span className={cn("text-xs tabular-nums", f.status === c.status ? "text-white/70" : "text-slate-500")}>{fmt(c.n)}</span>
          </Link>
        ))}
      </div>

      <MobileCollapse
        label={[f.district, f.type, f.q].some(Boolean) ? "Filters (active)" : "Filters"}
        openLabel="Hide filters"
        className="mb-6"
        panelClassName="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      >
        <form method="get" className="contents">
          {f.status && <input type="hidden" name="status" value={f.status} />}
          {f.size !== 50 && <input type="hidden" name="size" value={f.size} />}
          <select name="type" defaultValue={f.type} aria-label="Type">
            <option value="">Every type</option>
            {(overview?.by_type ?? []).map((t) => (
              <option key={t.type} value={t.type}>
                {TOURISM_TYPE_LABEL[t.type] ?? t.type} ({fmt(t.n)})
              </option>
            ))}
          </select>
          <select name="district" defaultValue={f.district} aria-label="District">
            <option value="">All districts</option>
            {(overview?.by_district ?? []).map((d) => (
              <option key={d.district} value={d.district}>
                {d.district} ({fmt(d.n)})
              </option>
            ))}
          </select>
          <input name="q" type="search" placeholder="Property, owner, town" defaultValue={f.q} aria-label="Search" />
          <SortSelect options={SORT_OPTIONS} sort={f.sort} dir={f.dir} />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" /> Filter
          </Button>
        </form>
      </MobileCollapse>
    </>
  );
}

async function Results({ f }: { f: Filters }) {
  const { supabase } = await requireAgent();
  const [{ overview, missing }, tracking] = await Promise.all([getTourismOverview(), getTourismTracking()]);
  if (missing) return null;
  const total = overview?.total ?? 0;
  const href = makeHref(f);

  let query = supabase
    .from("tourism_properties")
    .select("*, tourism_tracking(status, notes, updated_at)", { count: "exact" })
    .order(SORTS[f.sort].column, { ascending: f.dir === "asc", nullsFirst: false })
    .order("rooms", { ascending: false, nullsFirst: false })
    .order("rnet_nr")
    .range((f.page - 1) * f.size, f.page * f.size - 1);
  if (f.district) query = query.eq("district", f.district);
  if (f.type) query = query.eq("type", f.type);
  if (f.q) query = query.or(`name.ilike.%${f.q}%,owner_entity.ilike.%${f.q}%,operator_entity.ilike.%${f.q}%,municipality.ilike.%${f.q}%,locality.ilike.%${f.q}%`);
  if (f.status === "new") {
    const touched = tracking.map((t) => t.rnet_nr);
    if (touched.length) query = query.not("rnet_nr", "in", `(${touched.join(",")})`);
  } else if (f.status) {
    const ids = tracking.filter((t) => t.status === f.status).map((t) => t.rnet_nr);
    query = query.in("rnet_nr", ids.length ? ids : ["-"]);
  }
  const { data, count } = await query;
  const props = (data ?? []) as TourismPropertyWithTracking[];
  const shown = count ?? 0;

  // Company facts for the owners and operators on this page.
  const keys = [...new Set(props.flatMap((p) => [p.owner_entity, p.operator_entity]).filter((n): n is string => !!n).map(companyKey))];
  const companies = new Map<string, Company>();
  if (keys.length) {
    const { data: rows } = await supabase.from("companies").select("*").in("name_key", keys);
    for (const c of (rows ?? []) as Company[]) companies.set(c.name_key, c);
  }
  const companyOf = (name: string | null) => (name ? companies.get(companyKey(name)) : undefined);

  if (!props.length)
    return (
      <EmptyState
        icon={Globe}
        title={total > 0 ? "No properties match these filters" : "No tourist properties imported yet"}
        description={total > 0 ? "Clear a filter, pick another status or go back a page." : "Run scripts/import-open-data.mjs to load the register."}
      />
    );

  const sortLabel = SORT_OPTIONS.find((o) => o.key === f.sort && o.dir === f.dir)?.label.toLowerCase() ?? f.sort;
  return (
    <>
      <p className="mb-3 text-sm text-slate-500">
        {fmt(shown)} {shown === total ? "" : "matching "}properties · sorted by {sortLabel}
      </p>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <SortHeader label="Property" sortKey="name" current={f.sort} dir={f.dir} defaultDir="asc" href={href} />
                <SortHeader label="Location" sortKey="location" current={f.sort} dir={f.dir} defaultDir="asc" href={href} />
                <SortHeader label="Owner" sortKey="owner" current={f.sort} dir={f.dir} defaultDir="asc" href={href} />
                <PlainHeader label="Operator" />
                <PlainHeader label="Contact" />
                <PlainHeader label="My status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {props.map((p) => (
                <TourismTableRow key={p.rnet_nr} p={p} owner={companyOf(p.owner_entity)} operator={companyOf(p.operator_entity)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ul className="space-y-3 md:hidden">
        {props.map((p) => (
          <TourismCard key={p.rnet_nr} p={p} owner={companyOf(p.owner_entity)} />
        ))}
      </ul>
      <Pagination page={f.page} size={f.size} total={shown} href={href} />
    </>
  );
}
