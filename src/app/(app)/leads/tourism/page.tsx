import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Globe, Hotel, Search, Users } from "lucide-react";
import { LeadsTabs, SourceLine } from "@/components/leads-tabs";
import { MobileCollapse } from "@/components/mobile-collapse";
import { TOURISM_TYPE_LABEL, TourismCard, TourismTableRow } from "@/components/tourism-row";
import { Badge, Button, Card, CardBody, EmptyState, PageHeader, Stat } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/constants";
import { companyKey } from "@/lib/rnal";
import type { Company, LeadStatus, TourismOverview, TourismPropertyWithTracking } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Owner leads · Tourist properties" };

const PAGE_SIZE = 50;
type Param = string | string[] | undefined;
const first = (v: Param) => (Array.isArray(v) ? v[0] : v) ?? "";
const fmt = (n: number) => n.toLocaleString("en-GB");

export default async function TourismPage({ searchParams }: { searchParams: Promise<Record<string, Param>> }) {
  const params = await searchParams;
  const { supabase, agent } = await requireAgent();

  const district = first(params.district);
  const type = first(params.type);
  const q = first(params.q).trim().replace(/[,()%]/g, " ");
  const status = (LEAD_STATUSES as string[]).includes(first(params.status)) ? (first(params.status) as LeadStatus) : "";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [overviewRes, trackingRes] = await Promise.all([
    supabase.rpc("tourism_overview"),
    supabase.from("tourism_tracking").select("rnet_nr, status").eq("agent_id", agent.id),
  ]);
  const needsMigration = !!overviewRes.error;
  const overview = (overviewRes.data ?? null) as TourismOverview | null;
  const total = overview?.total ?? 0;
  const tracking = (trackingRes.data ?? []) as { rnet_nr: string; status: LeadStatus }[];

  let query = supabase
    .from("tourism_properties")
    .select("*, tourism_tracking(status, notes, updated_at)", { count: "exact" })
    .order("category", { ascending: false, nullsFirst: false })
    .order("rooms", { ascending: false, nullsFirst: false })
    .order("rnet_nr")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (district) query = query.eq("district", district);
  if (type) query = query.eq("type", type);
  if (q) query = query.or(`name.ilike.%${q}%,owner_entity.ilike.%${q}%,operator_entity.ilike.%${q}%,municipality.ilike.%${q}%,locality.ilike.%${q}%`);
  if (status === "new") {
    const touched = tracking.map((t) => t.rnet_nr);
    if (touched.length) query = query.not("rnet_nr", "in", `(${touched.join(",")})`);
  } else if (status) {
    const ids = tracking.filter((t) => t.status === status).map((t) => t.rnet_nr);
    query = query.in("rnet_nr", ids.length ? ids : ["-"]);
  }
  const { data, count } = needsMigration ? { data: [], count: 0 } : await query;
  const props = (data ?? []) as TourismPropertyWithTracking[];
  const shown = count ?? 0;
  const pages = Math.max(1, Math.ceil(shown / PAGE_SIZE));

  // Company facts for the owners and operators on this page.
  const keys = [...new Set(props.flatMap((p) => [p.owner_entity, p.operator_entity]).filter((n): n is string => !!n).map(companyKey))];
  const companies = new Map<string, Company>();
  if (keys.length) {
    const { data: rows } = await supabase.from("companies").select("*").in("name_key", keys);
    for (const c of (rows ?? []) as Company[]) companies.set(c.name_key, c);
  }
  const companyOf = (name: string | null) => (name ? companies.get(companyKey(name)) : undefined);

  const counters = LEAD_STATUSES.map((s) => ({
    status: s,
    n: s === "new" ? Math.max(total - tracking.length, 0) : tracking.filter((t) => t.status === s).length,
  }));
  const href = (overrides: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    const current: Record<string, string> = { district, type, q, status, page: page > 1 ? String(page) : "" };
    for (const [k, v] of Object.entries({ ...current, ...overrides })) if (v !== null && v !== "" && v !== undefined) p.set(k, String(v));
    const s = p.toString();
    return s ? `/leads/tourism?${s}` : "/leads/tourism";
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition",
      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
    );
  const topTypes = (overview?.by_type ?? []).slice(0, 2);

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
        checkedOn={overview?.checked_on}
      />

      {needsMigration && (
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

      {!needsMigration && total > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Tourist properties" value={fmt(total)} hint="Whole country, open data" icon={Hotel} tone="teal" />
          {topTypes.map((t) => (
            <Stat key={t.type} label={TOURISM_TYPE_LABEL[t.type] ?? t.type} value={fmt(t.n)} icon={Building2} />
          ))}
          <Stat label="Owner ≠ operator" value={fmt(overview?.owner_differs ?? 0)} hint={`${fmt(overview?.with_website ?? 0)} have a website`} icon={Users} />
        </div>
      )}

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href({ status: null, page: null })} className={chip(!status)}>
          All <span className={cn("text-xs tabular-nums", !status ? "text-white/70" : "text-slate-500")}>{fmt(total)}</span>
        </Link>
        {counters.map((c) => (
          <Link key={c.status} href={href({ status: c.status, page: null })} className={chip(status === c.status)}>
            {LEAD_STATUS_LABEL[c.status]} <span className={cn("text-xs tabular-nums", status === c.status ? "text-white/70" : "text-slate-500")}>{fmt(c.n)}</span>
          </Link>
        ))}
      </div>

      <MobileCollapse
        label={[district, type, q].some(Boolean) ? "Filters (active)" : "Filters"}
        openLabel="Hide filters"
        className="mb-6"
        panelClassName="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
      >
        <form method="get" className="contents">
          {status && <input type="hidden" name="status" value={status} />}
          <select name="type" defaultValue={type} aria-label="Type">
            <option value="">Every type</option>
            {(overview?.by_type ?? []).map((t) => (
              <option key={t.type} value={t.type}>
                {TOURISM_TYPE_LABEL[t.type] ?? t.type} ({fmt(t.n)})
              </option>
            ))}
          </select>
          <select name="district" defaultValue={district} aria-label="District">
            <option value="">All districts</option>
            {(overview?.by_district ?? []).map((d) => (
              <option key={d.district} value={d.district}>
                {d.district} ({fmt(d.n)})
              </option>
            ))}
          </select>
          <input name="q" type="search" placeholder="Property, owner, town" defaultValue={q} aria-label="Search" />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" /> Filter
          </Button>
        </form>
      </MobileCollapse>

      {props.length === 0 ? (
        <EmptyState
          icon={Globe}
          title={total > 0 ? "No properties match these filters" : "No tourist properties imported yet"}
          description={total > 0 ? "Clear a filter or pick another status." : "Run scripts/import-open-data.mjs to load the register."}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            Showing {fmt((page - 1) * PAGE_SIZE + 1)}–{fmt(Math.min(page * PAGE_SIZE, shown))} of {fmt(shown)}, highest category first
          </p>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">My status</th>
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
          {pages > 1 && (
            <nav aria-label="Pages" className="mt-6 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link href={href({ page: page - 1 })} className="font-medium text-brand-700 hover:underline">
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <Badge>
                Page {fmt(page)} of {fmt(pages)}
              </Badge>
              {page < pages ? (
                <Link href={href({ page: page + 1 })} className="font-medium text-brand-700 hover:underline">
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
