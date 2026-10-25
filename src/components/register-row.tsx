"use client";

import { useFormStatus } from "react-dom";
import { Building2, DownloadCloud, ExternalLink, Landmark, Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { fetchOperator } from "@/app/(app)/leads/actions";
import type { LeadStatus, RegisterContact, RegisterOperator, RegisterRentalWithTracking } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTracking } from "./tracking-controls";

export const LAND_REGISTRY_URL = "https://www.predialonline.pt/";

function FetchButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 text-[13px] font-medium text-brand-800 transition hover:border-brand-300 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DownloadCloud className="h-3.5 w-3.5" />}
      {pending ? "Reading record…" : "Get operator details"}
    </button>
  );
}

function OperatorCell({ rental, op, canSee }: { rental: RegisterRentalWithTracking; op: RegisterOperator | undefined; canSee: boolean }) {
  if (!rental.enriched_at) {
    return canSee ? (
      <form action={fetchOperator}>
        <input type="hidden" name="id" value={rental.rnal_nr} />
        <FetchButton />
        <p className="mt-1 text-[12px] text-slate-500">Reads the official record once</p>
      </form>
    ) : (
      <p className="text-[13px] text-slate-500">
        Not fetched yet.{" "}
        <a href={rental.source_url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
          Open the record
        </a>
      </p>
    );
  }
  if (!canSee)
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-400">
        <Lock className="h-3.5 w-3.5" /> Admin only
      </span>
    );
  if (!op) return <span className="text-slate-400">—</span>;
  return (
    <div className="min-w-0 space-y-0.5 text-[13px]">
      <p className="flex items-center gap-1.5 font-medium text-slate-900">
        {op.kind === "company" ? <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
        <span className="truncate">{op.name ?? "—"}</span>
      </p>
      {op.email && (
        <a href={`mailto:${op.email}`} className="flex items-center gap-1.5 text-brand-700 hover:underline">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{op.email}</span>
        </a>
      )}
      {op.phone && (
        <a href={`tel:${op.phone}`} className="flex items-center gap-1.5 text-brand-700 hover:underline">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span className="tabular-nums">{op.phone}</span>
        </a>
      )}
      {!op.email && !op.phone && <p className="text-slate-400">No contact listed</p>}
    </div>
  );
}

const ROLE_TONE: Record<string, string> = {
  Owner: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  Tenant: "bg-sky-50 text-sky-800 ring-sky-600/20",
  Borrower: "bg-amber-50 text-amber-800 ring-amber-600/20",
};

function Role({ role, kind }: { role: string | null; kind: string | null }) {
  if (!role) return <span className="text-[13px] text-slate-400">Unknown until fetched</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", ROLE_TONE[role] ?? "bg-slate-100 text-slate-700 ring-slate-500/10")}>
      {role}
      {kind && <span className="opacity-60">· {kind}</span>}
    </span>
  );
}

function SourceLinks({ rental }: { rental: RegisterRentalWithTracking }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-slate-500">
      <a href={rental.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand-700" title="Official record, Turismo de Portugal">
        RNAL {rental.rnal_nr}/AL <ExternalLink className="h-3 w-3" />
      </a>
      <a href={LAND_REGISTRY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand-700" title="Check the registered owner (paid, about €15)">
        <Landmark className="h-3 w-3" /> Land registry
      </a>
    </div>
  );
}

function statusOf(r: RegisterRentalWithTracking): { status: LeadStatus; notes: string | null } {
  const t = r.register_tracking[0];
  return { status: t?.status ?? "new", notes: t?.notes ?? null };
}

/** Desktop: one table row (plus the notes row when open). */
export function RegisterTableRow({ rental, contact, canSee }: { rental: RegisterRentalWithTracking; contact: RegisterContact | undefined; canSee: boolean }) {
  const { status, notes } = statusOf(rental);
  const { controls, editor } = useTracking("register", rental.rnal_nr, status, notes);
  const op = contact?.operators[0];
  return (
    <>
      <tr className={cn("align-top", status === "not_interested" && "opacity-60")}>
        <td className="px-4 py-3">
          <p className="font-medium text-slate-900">{rental.name ?? "—"}</p>
          <p className="text-[13px] text-slate-500">
            {rental.modality ?? "—"}
            {rental.guests ? ` · ${rental.guests} guests` : ""}
            {rental.rooms ? ` · ${rental.rooms} bd` : ""}
          </p>
          <SourceLinks rental={rental} />
        </td>
        <td className="px-4 py-3">
          <p className="text-slate-900">{rental.parish ?? rental.locality ?? "—"}</p>
          <p className="text-[13px] text-slate-500">
            {rental.municipality}
            {rental.district && rental.district !== rental.municipality ? `, ${rental.district}` : ""}
          </p>
          {(contact?.address || rental.address) && <p className="mt-0.5 max-w-[24ch] text-[12px] text-slate-500">{(canSee && contact?.address) || rental.address}</p>}
        </td>
        <td className="px-4 py-3">
          <Role role={rental.operator_role} kind={rental.operator_kind} />
          {(rental.operators ?? 0) > 1 && <p className="mt-1 text-[12px] text-slate-500">+{(rental.operators ?? 1) - 1} more</p>}
        </td>
        <td className="max-w-[260px] px-4 py-3">
          <OperatorCell rental={rental} op={op} canSee={canSee} />
        </td>
        <td className="px-4 py-3">
          {controls}
          {notes && !editor && <p className="mt-1.5 max-w-[24ch] truncate text-[12px] text-slate-500">{notes}</p>}
        </td>
      </tr>
      {editor && (
        <tr>
          <td colSpan={5} className="bg-slate-50/70 px-4 py-3">
            {editor}
          </td>
        </tr>
      )}
    </>
  );
}

/** Phones: the same data as a card. */
export function RegisterCard({ rental, contact, canSee }: { rental: RegisterRentalWithTracking; contact: RegisterContact | undefined; canSee: boolean }) {
  const { status, notes } = statusOf(rental);
  const { controls, editor } = useTracking("register", rental.rnal_nr, status, notes);
  const op = contact?.operators[0];
  return (
    <li className={cn("rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]", status === "not_interested" && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{rental.name ?? "—"}</p>
          <p className="text-[13px] text-slate-500">
            {rental.modality} · {rental.parish ?? rental.municipality}
          </p>
        </div>
        {rental.operator_role && <Role role={rental.operator_role} kind={rental.operator_kind} />}
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
        <OperatorCell rental={rental} op={op} canSee={canSee} />
        {(contact?.address || rental.address) && <p className="mt-1.5 text-[12px] text-slate-500">{(canSee && contact?.address) || rental.address}</p>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {controls}
        <SourceLinks rental={rental} />
      </div>
      {editor && <div className="mt-3">{editor}</div>}
    </li>
  );
}
