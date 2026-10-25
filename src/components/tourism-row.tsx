"use client";

import { Building2, ExternalLink, Globe, Landmark, Mail, Star } from "lucide-react";
import type { Company, LeadStatus, TourismPropertyWithTracking } from "@/lib/types";
import { TOURISM_TYPE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LAND_REGISTRY_URL } from "./register-row";
import { useTracking } from "./tracking-controls";

const typeLabel = (t: string | null) => (t ? (TOURISM_TYPE_LABEL[t] ?? t) : "—");
const companySearch = (name: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:racius.com "${name}"`)}`;
const site = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

function EntityCell({ name, company }: { name: string | null; company: Company | undefined }) {
  if (!name) return <span className="text-slate-400">—</span>;
  return (
    <div className="min-w-0 text-[13px]">
      <p className="flex items-start gap-1.5 font-medium text-slate-900">
        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="line-clamp-2">{name}</span>
      </p>
      {company?.found ? (
        <div className="mt-1 space-y-0.5 pl-5 text-[12px] text-slate-500">
          <p>
            NIF {company.nif}
            {company.legal_form ? ` · ${company.legal_form}` : ""}
          </p>
          {(company.founded_on || company.capital) && (
            <p>
              {company.founded_on ? `Since ${company.founded_on.slice(0, 4)}` : ""}
              {company.founded_on && company.capital ? " · " : ""}
              {company.capital ? `Capital ${company.capital}` : ""}
            </p>
          )}
          {company.address && <p className="line-clamp-1">{company.address}</p>}
          {company.source_url && (
            <a href={company.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
              Company register <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ) : (
        <a href={companySearch(name)} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 pl-5 text-[12px] text-slate-500 hover:text-brand-700">
          Look up company <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function ContactCell({ p }: { p: TourismPropertyWithTracking }) {
  return (
    <div className="min-w-0 space-y-0.5 text-[13px]">
      {p.email && (
        <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-brand-700 hover:underline">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{p.email}</span>
        </a>
      )}
      {p.website && (
        <a href={site(p.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-brand-700 hover:underline">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{p.website.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}</span>
        </a>
      )}
      {!p.email && !p.website && <span className="text-slate-400">—</span>}
    </div>
  );
}

function Title({ p }: { p: TourismPropertyWithTracking }) {
  return (
    <>
      <p className="font-medium text-slate-900">{p.name ?? "—"}</p>
      <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-slate-500">
        <span>{typeLabel(p.type)}</span>
        {p.category ? (
          <span className="inline-flex items-center gap-0.5 text-amber-600" aria-label={`${p.category} stars`}>
            {Array.from({ length: p.category }, (_, i) => (
              <Star key={i} className="h-3 w-3 fill-current" />
            ))}
          </span>
        ) : null}
        {p.rooms ? <span>· {p.rooms} rooms</span> : p.units ? <span>· {p.units} units</span> : null}
        {p.golf && <span>· golf</span>}
        {p.spa && <span>· spa</span>}
        {p.listed_building && <span>· listed building</span>}
      </p>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-slate-500">
        <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand-700" title="Official record, Turismo de Portugal">
          RNET {p.rnet_nr} <ExternalLink className="h-3 w-3" />
        </a>
        <a href={LAND_REGISTRY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand-700" title="Check the registered owner (paid, about €15)">
          <Landmark className="h-3 w-3" /> Land registry
        </a>
      </div>
    </>
  );
}

function statusOf(p: TourismPropertyWithTracking): { status: LeadStatus; notes: string | null } {
  const t = p.tourism_tracking[0];
  return { status: t?.status ?? "new", notes: t?.notes ?? null };
}

export function TourismTableRow({ p, owner, operator }: { p: TourismPropertyWithTracking; owner: Company | undefined; operator: Company | undefined }) {
  const { status, notes } = statusOf(p);
  const { controls, editor } = useTracking("tourism", p.rnet_nr, status, notes);
  const sameOperator = !p.operator_entity || p.operator_entity === p.owner_entity;
  return (
    <>
      <tr className={cn("align-top", status === "not_interested" && "opacity-60")}>
        <td className="px-4 py-3">
          <Title p={p} />
        </td>
        <td className="px-4 py-3">
          <p className="text-slate-900">{p.locality ?? p.parish ?? "—"}</p>
          <p className="text-[13px] text-slate-500">
            {p.municipality}
            {p.district && p.district !== p.municipality ? `, ${p.district}` : ""}
          </p>
        </td>
        <td className="max-w-[240px] px-4 py-3">
          <EntityCell name={p.owner_entity} company={owner} />
        </td>
        <td className="max-w-[220px] px-4 py-3">{sameOperator ? <span className="text-[13px] text-slate-500">Same as owner</span> : <EntityCell name={p.operator_entity} company={operator} />}</td>
        <td className="max-w-[220px] px-4 py-3">
          <ContactCell p={p} />
        </td>
        <td className="px-4 py-3">
          {controls}
          {notes && !editor && <p className="mt-1.5 max-w-[20ch] truncate text-[12px] text-slate-500">{notes}</p>}
        </td>
      </tr>
      {editor && (
        <tr>
          <td colSpan={6} className="bg-slate-50/70 px-4 py-3">
            {editor}
          </td>
        </tr>
      )}
    </>
  );
}

export function TourismCard({ p, owner }: { p: TourismPropertyWithTracking; owner: Company | undefined }) {
  const { status, notes } = statusOf(p);
  const { controls, editor } = useTracking("tourism", p.rnet_nr, status, notes);
  return (
    <li className={cn("rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]", status === "not_interested" && "opacity-70")}>
      <Title p={p} />
      <p className="mt-1 text-[13px] text-slate-500">
        {p.locality ?? p.parish}, {p.municipality}
      </p>
      <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
        <EntityCell name={p.owner_entity} company={owner} />
        <ContactCell p={p} />
      </div>
      <div className="mt-3">{controls}</div>
      {editor && <div className="mt-3">{editor}</div>}
    </li>
  );
}
