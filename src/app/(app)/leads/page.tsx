import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Mail, Phone, Search, UserCheck, UserSearch } from "lucide-react";
import { LeadsTabs } from "@/components/leads-tabs";
import { MobileCollapse } from "@/components/mobile-collapse";
import { RegisterCard, RegisterTableRow } from "@/components/register-row";
import { Badge, Button, Card, CardBody, EmptyState, PageHeader, Stat } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { LeadStatus, RegisterContact, RegisterRentalWithTracking } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Owner leads" };

const PAGE_SIZE = 50;
const ROLES = ["Owner", "Tenant", "Borrower"] as const;
type Param = string | string[] | undefined;
const first = (v: Param) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function RegisteredOwnersPage({ searchParams }: { searchParams: Promise<Record<string, Param>> }) {
  const params = await searchParams;
  const { supabase, agent } = await requireAgent();

  const district = first(params.district);
  const role = (ROLES as readonly string[]).includes(first(params.role)) ? first(params.role) : "";
  const contact = ["email", "phone"].includes(first(params.contact)) ? first(params.contact) : "";
  const q = first(params.q).trim().replace(/[,()]/g, " ");
  const status = (LEAD_STATUSES as string[]).includes(first(params.status)) ? (first(params.status) as LeadStatus) : "";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const head = { count: "exact" as const, head: true };
  const [totalRes, emailRes, phoneRes, ownerRes, districtsRes, trackingRes, canSeeRes] = await Promise.all([
    supabase.from("register_rentals").select("*", head),
    supabase.from("register_rentals").select("*", head).eq("has_email", true),
    supabase.from("register_rentals").select("*", head).eq("has_phone", true),
    supabase.from("register_rentals").select("*", head).eq("operator_role", "Owner"),
    supabase.from("register_rentals").select("district, checked_on"),
    supabase.from("register_tracking").select("rnal_nr, status").eq("agent_id", agent.id),
    supabase.rpc("can_see_owner_contacts"),
  ]);
  // Head-only counts on a missing table come back empty without an error, so check an ordinary select.
  const needsMigration = !!trackingRes.error && (trackingRes.error.code === "PGRST205" || trackingRes.error.code === "42P01");
  const total = totalRes.count ?? 0;
  const canSee = canSeeRes.data === true;
  const tracking = (trackingRes.data ?? []) as { rnal_nr: string; status: LeadStatus }[];
  const districtRows = (districtsRes.data ?? []) as { district: string | null; checked_on: string | null }[];
  const districts = Object.entries(
    districtRows.reduce<Record<string, number>>((m, r) => {
      if (r.district) m[r.district] = (m[r.district] ?? 0) + 1;
      return m;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const checkedOn = districtRows.reduce<string | null>((m, r) => (r.checked_on && (!m || r.checked_on > m) ? r.checked_on : m), null);
  const pct = (n: number | null) => (total ? `${Math.round(((n ?? 0) / total) * 100)}%` : "—");

  let query = supabase
    .from("register_rentals")
    .select("*, register_tracking(status, notes, updated_at)", { count: "exact" })
    .order("rnal_nr", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (district) query = query.eq("district", district);
  if (role) query = query.eq("operator_role", role);
  if (contact === "email") query = query.eq("has_email", true);
  if (contact === "phone") query = query.eq("has_phone", true);
  if (q) query = query.or(`name.ilike.%${q}%,parish.ilike.%${q}%,municipality.ilike.%${q}%,rnal_nr.ilike.%${q}%`);
  if (status === "new") {
    const touched = tracking.map((t) => t.rnal_nr);
    if (touched.length) query = query.not("rnal_nr", "in", `(${touched.join(",")})`);
  } else if (status) {
    const ids = tracking.filter((t) => t.status === status).map((t) => t.rnal_nr);
    query = query.in("rnal_nr", ids.length ? ids : ["-"]);
  }
  const { data, count } = needsMigration ? { data: [], count: 0 } : await query;
  const rentals = (data ?? []) as RegisterRentalWithTracking[];
  const shown = count ?? 0;
  const pages = Math.max(1, Math.ceil(shown / PAGE_SIZE));

  // Contacts come back only for the admin login (row level security).
  const contacts = new Map<string, RegisterContact>();
  if (canSee && rentals.length) {
    const { data: rows } = await supabase
      .from("register_contacts")
      .select("rnal_nr, address, operators")
      .in(
        "rnal_nr",
        rentals.map((r) => r.rnal_nr),
      );
    for (const c of (rows ?? []) as RegisterContact[]) contacts.set(c.rnal_nr, c);
  }

  const counters = LEAD_STATUSES.map((s) => ({
    status: s,
    n: s === "new" ? Math.max(total - tracking.length, 0) : tracking.filter((t) => t.status === s).length,
  }));
  const href = (overrides: Record<string, string | number | null>) => {
    const p = new URLSearchParams();
    const current: Record<string, string> = { district, role, contact, q, status, page: page > 1 ? String(page) : "" };
    for (const [k, v] of Object.entries({ ...current, ...overrides })) if (v !== null && v !== "" && v !== undefined) p.set(k, String(v));
    const s = p.toString();
    return s ? `/leads?${s}` : "/leads";
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition",
      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
    );

  return (
    <>
      <PageHeader
        title="Owner leads"
        description="Who actually runs each holiday rental, from Turismo de Portugal's public register (RNAL). Every record names the operator, says whether they own the property, and usually gives an email; the register publishes this by law (DL 128/2014, art. 10)."
      />

      <LeadsTabs active="register" />

      {needsMigration && (
        <Card className="mb-6 border-amber-300 bg-amber-50/80">
          <CardBody className="text-sm text-amber-900">
            <p className="font-semibold">One database step is missing.</p>
            <p className="mt-1">
              In Supabase open <strong>SQL Editor</strong>, paste <code className="rounded bg-amber-100 px-1">supabase/migrations/0006_register_owners.sql</code> and run it, then run{" "}
              <code className="rounded bg-amber-100 px-1">node scripts/import-rnal.mjs</code>.
            </p>
          </CardBody>
        </Card>
      )}

      {!needsMigration && total > 0 && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Rentals" value={total} hint={checkedOn ? `Checked ${formatDate(checkedOn)}` : undefined} icon={UserSearch} tone="teal" />
            <Stat label="Run by the owner" value={pct(ownerRes.count)} hint={`${ownerRes.count ?? 0} owners, the rest tenants or borrowers`} icon={UserCheck} />
            <Stat label="With email" value={pct(emailRes.count)} icon={Mail} />
            <Stat label="With phone" value={pct(phoneRes.count)} icon={Phone} />
          </div>
          {!canSee && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p>
                Names, emails, phones and street addresses are hidden in the public demo. Sign in as the admin to see them, or open any official record to read it on the register.{" "}
                <Link href="/login" className="font-medium text-brand-700 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </>
      )}

      {/* My pipeline */}
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href({ status: null, page: null })} className={chip(!status)}>
          All <span className={cn("text-xs tabular-nums", !status ? "text-white/70" : "text-slate-500")}>{total}</span>
        </Link>
        {counters.map((c) => (
          <Link key={c.status} href={href({ status: c.status, page: null })} className={chip(status === c.status)}>
            {LEAD_STATUS_LABEL[c.status]} <span className={cn("text-xs tabular-nums", status === c.status ? "text-white/70" : "text-slate-500")}>{c.n}</span>
          </Link>
        ))}
      </div>

      <MobileCollapse
        label={[district, role, contact, q].some(Boolean) ? "Filters (active)" : "Filters"}
        openLabel="Hide filters"
        className="mb-6"
        panelClassName="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      >
        <form method="get" className="contents">
          {status && <input type="hidden" name="status" value={status} />}
          <select name="district" defaultValue={district} aria-label="District">
            <option value="">All districts</option>
            {districts.map(([d, n]) => (
              <option key={d} value={d}>
                {d} ({n})
              </option>
            ))}
          </select>
          <select name="role" defaultValue={role} aria-label="Operator role">
            <option value="">Owner, tenant or borrower</option>
            <option value="Owner">Run by the owner</option>
            <option value="Tenant">Run by a tenant</option>
            <option value="Borrower">Run by a borrower</option>
          </select>
          <select name="contact" defaultValue={contact} aria-label="Contact">
            <option value="">Any contact</option>
            <option value="email">Has email</option>
            <option value="phone">Has phone</option>
          </select>
          <input name="q" type="search" placeholder="Name, parish, town or nº" defaultValue={q} aria-label="Search" />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" /> Filter
          </Button>
        </form>
      </MobileCollapse>

      {rentals.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title={total > 0 ? "No owners match these filters" : "No registered owners imported yet"}
          description={
            total > 0 ? "Clear a filter or pick another status." : "Collect a sample with scripts/scrape-rnal.mjs, then load it with scripts/import-rnal.mjs."
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, shown)} of {shown}
          </p>

          {/* Desktop: a real table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Rental</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Run by</th>
                    <th className="px-4 py-3">Operator and contact</th>
                    <th className="px-4 py-3">My status</th>
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

          {/* Phones: cards */}
          <ul className="space-y-3 md:hidden">
            {rentals.map((r) => (
              <RegisterCard key={r.rnal_nr} rental={r} contact={contacts.get(r.rnal_nr)} canSee={canSee} />
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
                Page {page} of {pages}
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
