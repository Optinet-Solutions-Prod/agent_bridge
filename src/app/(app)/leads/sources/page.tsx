import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { LeadsTabs } from "@/components/leads-tabs";
import { Badge, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { OwnerLeadOverview, RegisterOverview, TourismOverview } from "@/lib/types";

export const metadata: Metadata = { title: "Owner leads · Sources" };

const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-GB");

type Source = {
  name: string;
  publisher: string;
  what: string;
  inApp: string;
  status: "imported" | "on-demand" | "linked" | "sample";
  basis: string;
  links: { href: string; text: string }[];
  checked?: string | null;
};

const STATUS: Record<Source["status"], { label: string; tone: "green" | "blue" | "amber" | "neutral" }> = {
  imported: { label: "Imported", tone: "green" },
  "on-demand": { label: "Read on demand", tone: "blue" },
  sample: { label: "Sample", tone: "amber" },
  linked: { label: "Linked, not imported", tone: "neutral" },
};

export default async function SourcesPage() {
  const { supabase } = await requireAgent();
  const [reg, tour, leads, comp, compFound] = await Promise.all([
    supabase.rpc("register_overview"),
    supabase.rpc("tourism_overview"),
    supabase.rpc("owner_lead_overview"),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("found", true),
  ]);
  const r = reg.data as RegisterOverview | null;
  const t = tour.data as TourismOverview | null;
  const l = leads.data as OwnerLeadOverview | null;

  const sources: Source[] = [
    {
      name: "Holiday-rental register (RNAL), open dataset",
      publisher: "Turismo de Portugal",
      what: "Every registered holiday rental: register number, name, type, guests, street address, parish, municipality, GPS position, registration and opening dates.",
      inApp: `${fmt(r?.total)} rentals in Holiday rentals.`,
      status: "imported",
      basis: "Public open data published for reuse.",
      links: [
        { href: "https://dadosabertos.turismodeportugal.pt/datasets/turismoportugal::estabelecimentos-de-alojamento-local", text: "Dataset" },
        { href: "https://rnt.turismodeportugal.pt/RNT/Pesquisa_AL.aspx", text: "Register search" },
      ],
      checked: r?.checked_on,
    },
    {
      name: "Holiday-rental register (RNAL), individual records",
      publisher: "Turismo de Portugal",
      what: "Who runs each rental (owner, tenant or borrower), their name, email and sometimes phone, and the full address.",
      inApp: `${fmt(r?.enriched)} records read so far. The admin reads one record at a time with “Get operator details”; contacts are visible to the admin only.`,
      status: "on-demand",
      basis: "Published by law, DL 128/2014, art. 10. Not bulk-copied: these are mostly private individuals.",
      links: [{ href: "https://rnt.turismodeportugal.pt/RNT/RNAL.aspx?nr=182013", text: "Example record" }],
    },
    {
      name: "Tourist-property register (RNET), open dataset",
      publisher: "Turismo de Portugal",
      what: "Hotels, country houses, agritourism, manor houses, tourist apartments and villages: the owning entity, the operating entity, email, website, category, rooms and location.",
      inApp: `${fmt(t?.total)} properties in Tourist properties.`,
      status: "imported",
      basis: "Public open data published for reuse.",
      links: [
        { href: "https://dadosabertos.turismodeportugal.pt/datasets/84912bbcfc7041eba5722a6f52b6bddf_0", text: "Dataset" },
        { href: "https://rnt.turismodeportugal.pt/RNT/RNET.aspx?nr=9703", text: "Example record" },
      ],
      checked: t?.checked_on,
    },
    {
      name: "Company directory",
      publisher: "Racius (from the commercial register and official publications)",
      what: "For companies that own or run tourist properties: tax number (NIF), head office, legal form, share capital, activity and founding date.",
      inApp: `${fmt(compFound.count)} of ${fmt(comp.count)} companies matched, shown under each owner and operator.`,
      status: "imported",
      basis: "Public company information; no individuals.",
      links: [
        { href: "https://www.racius.com/", text: "Racius" },
        { href: "https://publicacoes.mj.pt/", text: "Official company publications" },
      ],
    },
    {
      name: "Land registry (Registo Predial)",
      publisher: "Instituto dos Registos e do Notariado",
      what: "The legal owner of a specific property, with charges and mortgages.",
      inApp: "Not imported. Each row has a Land registry link to verify an owner when a lead is serious.",
      status: "linked",
      basis: "Paid per property (about €15) through Predial Online, needs an account and the property's registry or tax number; no bulk access.",
      links: [{ href: "https://www.predialonline.pt/", text: "Predial Online" }],
    },
    {
      name: "Private-seller listings",
      publisher: "OLX (collected by our team)",
      what: "Homes advertised as sold or rented by private owners: price, size, typology, parish, link to the ad.",
      inApp: `${fmt(l?.total)} listings in Portal listings. The portals hide the owner, so identity is not verified.`,
      status: "sample",
      basis: "Public adverts, collected manually; Idealista, OLX and Imovirtual block automated access.",
      links: [{ href: "https://www.olx.pt/imoveis/", text: "OLX Imóveis" }],
      checked: l?.checked_on,
    },
  ];

  return (
    <>
      <PageHeader title="Owner leads" description="Where every lead in Ponte comes from, what each source gives, and how it is used." />
      <LeadsTabs active="sources" />
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <ul className="divide-y divide-slate-100">
          {sources.map((s) => (
            <li key={s.name} className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[1.1fr_1.4fr_1fr] lg:gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge>
                </div>
                <p className="mt-0.5 text-[13px] text-slate-500">{s.publisher}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {s.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">
                      {l.text} <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="text-sm text-slate-700">
                <p>{s.what}</p>
                <p className="mt-1.5 text-slate-900">{s.inApp}</p>
              </div>
              <div className="text-[13px] text-slate-500">
                <p>{s.basis}</p>
                {s.checked && <p className="mt-1">Checked {formatDate(s.checked)}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
