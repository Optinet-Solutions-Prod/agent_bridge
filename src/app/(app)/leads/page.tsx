import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DownloadCloud, Lock, Mail, Search, UserCheck, UserSearch } from "lucide-react";
import { LeadsTabs, SourceLine } from "@/components/leads-tabs";
import { MobileCollapse } from "@/components/mobile-collapse";
import { RegisterCard, RegisterTableRow } from "@/components/register-row";
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
import { Button, Card, CardBody, EmptyState, PageHeader, Stat } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/constants";
import { getCanSeeContacts, getRegisterOverview, getRegisterTracking } from "@/lib/leads-data";
import type { LeadStatus, RegisterContact, RegisterRentalWithTracking } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Owner leads · Holiday rentals" };

const ROLES = ["Owner", "Tenant", "Borrower"] as const;
const SORTS = {
  newest: { column: "nr_num", defaultDir: "desc" },
  name: { column: "name", defaultDir: "asc" },
  location: { column: "municipality", defaultDir: "asc" },
  role: { column: "operator_role", defaultDir: "asc" },
  guests: { column: "guests", defaultDir: "desc" },
  opened: { column: "opened_on", defaultDir: "desc" },
} as const satisfies Record<string, { column: string; defaultDir: SortDir }>;
type SortKey = keyof typeof SORTS;
const SORT_OPTIONS: { key: SortKey; dir: SortDir; label: string }[] = [
  { key: "newest", dir: "desc", label: "Newest registration" },
  { key: "newest", dir: "asc", label: "Oldest registration" },
  { key: "name", dir: "asc", label: "Name A–Z" },
  { key: "location", dir: "asc", label: "Municipality A–Z" },
  { key: "guests", dir: "desc", label: "Most guests" },
  { key: "opened", dir: "desc", label: "Recently opened" },
  { key: "role", dir: "asc", label: "Run by (owner first)" },
];

type Param = string | string[] | undefined;
const first = (v: Param) => (Array.isArray(v) ? v[0] : v) ?? "";
const fmt = (n: number) => n.toLocaleString("en-GB");

function readFilters(raw: Record<string, Param>) {
  const params = applyOrderParam(raw);
  const table = readTableParams<SortKey>(params, SORTS, "newest");
  return {
    ...table,
    district: first(params.district),
    role: (ROLES as readonly string[]).includes(first(params.role)) ? first(params.role) : "",
    contact: ["email", "phone", "fetched", "unfetched"].includes(first(params.contact)) ? first(params.contact) : "",
    q: first(params.q).trim().replace(/[,()%]/g, " "),
    status: (LEAD_STATUSES as string[]).includes(first(params.status)) ? (first(params.status) as LeadStatus) : "",
  };
}
type Filters = ReturnType<typeof readFilters>;

const makeHref = (f: Filters) => (overrides: Record<string, string | number | null>) => {
  const p = new URLSearchParams();
  const current: Record<string, string> = {
    district: f.district,
    role: f.role,
    contact: f.contact,
    q: f.q,
    status: f.status,
    sort: f.isDefault ? "" : f.sort,
    dir: f.isDefault ? "" : f.dir,
    size: f.size === 50 ? "" : String(f.size),
    page: f.page > 1 ? String(f.page) : "",
  };
  for (const [k, v] of Object.entries({ ...current, ...overrides })) if (v !== null && v !== "" && v !== undefined) p.set(k, String(v));
  const s = p.toString();
  return s ? `/leads?${s}` : "/leads";
};
const isFiltered = (f: Filters) => !!(f.district || f.role || f.contact || f.q || f.status);

/** The shell renders at once; the summary and the table stream in behind skeletons. */
export default async function HolidayRentalsPage({ searchParams }: { searchParams: Promise<Record<string, Param>> }) {
  await requireAgent();
  const f = readFilters(await searchParams);
  return (
    <>
      <PageHeader
        title="Owner leads"
        description="Every registered holiday rental in Portugal. The register names who runs each one, whether they own it, and how to reach them; it publishes this by law (DL 128/2014, art. 10)."
      />
      <LeadsTabs active="register" />
      <SourceLine
        label="Registo Nacional de Alojamento Local (RNAL)"
        publisher="Turismo de Portugal"
        links={[
          { href: "https://dadosabertos.turismodeportugal.pt/datasets/turismoportugal::estabelecimentos-de-alojamento-local", text: "Open dataset" },
          { href: "https://rnt.turismodeportugal.pt/RNT/Pesquisa_AL.aspx", text: "Register search" },
        ]}
      />
      <Suspense fallback={<SummarySkeleton />}>
        <Summary f={f} />
      </Suspense>
      <Suspense key={makeHref(f)({})} fallback={<TableSkeleton />}>
        <Results f={f} />
      </Suspense>
    </>
  );
}

async function Summary({ f }: { f: Filters }) {
  const [{ overview, missing }, tracking, canSee] = await Promise.all([getRegisterOverview(), getRegisterTracking(), getCanSeeContacts()]);
  const total = overview?.total ?? 0;
  const enriched = overview?.enriched ?? 0;
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

  return (
    <>
      {missing && (
        <Card className="mb-6 border-amber-300 bg-amber-50/80">
          <CardBody className="text-sm text-amber-900">
            <p className="font-semibold">One database step is missing.</p>
            <p className="mt-1">
              In Supabase open <strong>SQL Editor</strong>, paste <code className="rounded bg-amber-100 px-1">supabase/migrations/0007_sources.sql</code> and run it, then run{" "}
              <code className="rounded bg-amber-100 px-1">node scripts/import-open-data.mjs</code>.
            </p>
          </CardBody>
        </Card>
      )}

      {!missing && total > 0 && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Registered rentals" value={fmt(total)} hint={overview?.checked_on ? `Open data, checked ${formatDate(overview.checked_on)}` : "Whole country, open data"} icon={UserSearch} tone="teal" />
            <Stat label="Operator details read" value={fmt(enriched)} hint="One official record at a time" icon={DownloadCloud} />
            <Stat
              label="Run by the owner"
              value={enriched ? `${Math.round(((overview?.owners ?? 0) / enriched) * 100)}%` : "—"}
              hint={enriched ? `of the ${fmt(enriched)} read` : undefined}
              icon={UserCheck}
            />
            <Stat label="With email" value={enriched ? `${Math.round(((overview?.with_email ?? 0) / enriched) * 100)}%` : "—"} hint={enriched ? `of the ${fmt(enriched)} read` : undefined} icon={Mail} />
          </div>
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            {canSee ? (
              <p>
                You are signed in as the admin. <strong className="font-medium text-slate-800">Get operator details</strong> reads that one official record and saves who runs the rental. Names,
                emails and phones stay visible to the admin only.
              </p>
            ) : (
              <p>
                Operator names, emails and phones are visible to the admin only, because this demo is open to anyone. Every row links to its official record.{" "}
                <Link href="/login" className="font-medium text-brand-700 hover:underline">
                  Sign in as admin
                </Link>
              </p>
            )}
          </div>
        </>
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
        label={[f.district, f.role, f.contact, f.q].some(Boolean) ? "Filters (active)" : "Filters"}
        openLabel="Hide filters"
        className="mb-6"
        panelClassName="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
      >
        <form method="get" className="contents">
          {f.status && <input type="hidden" name="status" value={f.status} />}
          {f.size !== 50 && <input type="hidden" name="size" value={f.size} />}
          <select name="district" defaultValue={f.district} aria-label="District">
            <option value="">All districts</option>
            {(overview?.by_district ?? []).map((d) => (
              <option key={d.district} value={d.district}>
                {d.district} ({fmt(d.n)})
              </option>
            ))}
          </select>
          <select name="role" defaultValue={f.role} aria-label="Operator role">
            <option value="">Owner, tenant or borrower</option>
            <option value="Owner">Run by the owner</option>
            <option value="Tenant">Run by a tenant</option>
            <option value="Borrower">Run by a borrower</option>
          </select>
          <select name="contact" defaultValue={f.contact} aria-label="Operator details">
            <option value="">Any</option>
            <option value="fetched">Operator details read</option>
            <option value="unfetched">Not read yet</option>
            <option value="email">Has email</option>
            <option value="phone">Has phone</option>
          </select>
          <input name="q" type="search" placeholder="Name, parish, town or nº" defaultValue={f.q} aria-label="Search" />
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
  const [{ overview, missing }, tracking, canSee] = await Promise.all([getRegisterOverview(), getRegisterTracking(), getCanSeeContacts()]);
  if (missing) return null;
  const total = overview?.total ?? 0;
  const filtered = isFiltered(f);
  const href = makeHref(f);

  let query = supabase
    .from("register_rentals")
    .select("*, register_tracking(status, notes, updated_at)", { count: filtered ? "estimated" : undefined })
    .order(SORTS[f.sort].column, { ascending: f.dir === "asc", nullsFirst: false })
    .order("nr_num", { ascending: false })
    .range((f.page - 1) * f.size, f.page * f.size - 1);
  if (f.district) query = query.eq("district", f.district);
  if (f.role) query = query.eq("operator_role", f.role);
  if (f.contact === "email") query = query.eq("has_email", true);
  if (f.contact === "phone") query = query.eq("has_phone", true);
  if (f.contact === "fetched") query = query.not("enriched_at", "is", null);
  if (f.contact === "unfetched") query = query.is("enriched_at", null);
  if (f.q) query = query.or(`name.ilike.%${f.q}%,parish.ilike.%${f.q}%,municipality.ilike.%${f.q}%,locality.ilike.%${f.q}%,rnal_nr.eq.${/^\d+$/.test(f.q) ? f.q : "0"}`);
  if (f.status === "new") {
    const touched = tracking.map((t) => t.rnal_nr);
    if (touched.length) query = query.not("rnal_nr", "in", `(${touched.join(",")})`);
  } else if (f.status) {
    const ids = tracking.filter((t) => t.status === f.status).map((t) => t.rnal_nr);
    query = query.in("rnal_nr", ids.length ? ids : ["-"]);
  }
  const { data, count } = await query;
  const rentals = (data ?? []) as RegisterRentalWithTracking[];
  const shown = filtered ? (count ?? 0) : total;

  // Contacts come back only for the admin login (row level security).
  const contacts = new Map<string, RegisterContact>();
  const fetchedIds = rentals.filter((r) => r.enriched_at).map((r) => r.rnal_nr);
  if (canSee && fetchedIds.length) {
    const { data: rows } = await supabase.from("register_contacts").select("rnal_nr, address, operators").in("rnal_nr", fetchedIds);
    for (const c of (rows ?? []) as RegisterContact[]) contacts.set(c.rnal_nr, c);
  }

  if (!rentals.length)
    return (
      <EmptyState
        icon={UserSearch}
        title={total > 0 ? "No rentals match these filters" : "No registered rentals imported yet"}
        description={total > 0 ? "Clear a filter, pick another status or go back a page." : "Run scripts/import-open-data.mjs to load the register."}
      />
    );

  const sortLabel = SORT_OPTIONS.find((o) => o.key === f.sort && o.dir === f.dir)?.label.toLowerCase() ?? f.sort;
  return (
    <>
      <p className="mb-3 text-sm text-slate-500">
        {filtered ? "About " : ""}
        {fmt(shown)} {filtered ? "matching " : ""}rentals · sorted by {sortLabel}
      </p>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <SortHeader label="Rental" sortKey="name" current={f.sort} dir={f.dir} defaultDir="asc" href={href} />
                <SortHeader label="Location" sortKey="location" current={f.sort} dir={f.dir} defaultDir="asc" href={href} />
                <SortHeader label="Run by" sortKey="role" current={f.sort} dir={f.dir} defaultDir="asc" href={href} />
                <PlainHeader label="Operator and contact" />
                <PlainHeader label="My status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentals.map((r) => (
                <RegisterTableRow key={r.rnal_nr} rental={r} contact={contacts.get(r.rnal_nr)} canSee={canSee} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {rentals.map((r) => (
          <RegisterCard key={r.rnal_nr} rental={r} contact={contacts.get(r.rnal_nr)} canSee={canSee} />
        ))}
      </ul>

      <Pagination page={f.page} size={f.size} total={shown} approximate={filtered} href={href} />
    </>
  );
}
