"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, ExternalLink, Loader2, Lock, Mail, Phone, StickyNote, User } from "lucide-react";
import { saveRegisterNotes, setRegisterStatus } from "@/app/(app)/leads/actions";
import { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/constants";
import type { LeadStatus, RegisterContact, RegisterOperator, RegisterRentalWithTracking } from "@/lib/types";
import { cn } from "@/lib/utils";

function StatusSelect({ nr, status }: { nr: string; status: LeadStatus }) {
  const { pending } = useFormStatus();
  return (
    <div className="relative">
      <select
        name="status"
        aria-label="My status for this owner"
        defaultValue={status}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={cn("!h-8 !w-auto !rounded-full !pl-3 !pr-8 text-[13px] font-medium", {
          "!border-sky-300 !bg-sky-50 !text-sky-900": status === "contacted",
          "!border-amber-300 !bg-amber-50 !text-amber-900": status === "appointment",
          "!border-emerald-300 !bg-emerald-50 !text-emerald-900": status === "listed",
          "!border-red-200 !bg-red-50 !text-red-800": status === "not_interested",
        })}
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <input type="hidden" name="rnal_nr" value={nr} />
      {pending && <Loader2 className="pointer-events-none absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />}
    </div>
  );
}

function SaveNotes() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[13px] font-medium text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50">
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
    </button>
  );
}

function Locked() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-400">
      <Lock className="h-3.5 w-3.5" /> Admin only
    </span>
  );
}

function OperatorContacts({ op, canSee, compact }: { op: RegisterOperator | undefined; canSee: boolean; compact?: boolean }) {
  if (!canSee) return <Locked />;
  if (!op) return <span className="text-slate-400">—</span>;
  return (
    <div className={cn("min-w-0 space-y-0.5", compact && "text-[13px]")}>
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
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", ROLE_TONE[role ?? ""] ?? "bg-slate-100 text-slate-700 ring-slate-500/10")}>
      {role ?? "Unknown"}
      {kind && <span className="opacity-60">· {kind}</span>}
    </span>
  );
}

function Notes({ nr, notes, onDone }: { nr: string; notes: string | null; onDone: () => void }) {
  return (
    <form action={saveRegisterNotes} onSubmit={() => setTimeout(onDone, 300)} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <input type="hidden" name="rnal_nr" value={nr} />
      <textarea name="notes" defaultValue={notes ?? ""} rows={2} placeholder="Private notes: called, left message, owner wants to sell…" className="!min-h-0 flex-1 text-sm" />
      <SaveNotes />
    </form>
  );
}

/** Desktop: one table row (plus an optional notes row). */
export function RegisterTableRow({ rental, contact, canSee }: { rental: RegisterRentalWithTracking; contact: RegisterContact | undefined; canSee: boolean }) {
  const tracking = rental.register_tracking[0];
  const status: LeadStatus = tracking?.status ?? "new";
  const [notesOpen, setNotesOpen] = useState(false);
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
          <a href={rental.source_url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-brand-700">
            RNAL {rental.rnal_nr}/AL <ExternalLink className="h-3 w-3" />
          </a>
        </td>
        <td className="px-4 py-3">
          <p className="text-slate-900">{rental.parish ?? "—"}</p>
          <p className="text-[13px] text-slate-500">
            {rental.municipality}
            {rental.district && rental.district !== rental.municipality ? `, ${rental.district}` : ""}
          </p>
          {canSee && contact?.address && <p className="mt-0.5 max-w-[22ch] text-[12px] text-slate-500">{contact.address}</p>}
        </td>
        <td className="px-4 py-3">
          <Role role={rental.operator_role} kind={rental.operator_kind} />
          {rental.operators > 1 && <p className="mt-1 text-[12px] text-slate-500">+{rental.operators - 1} more</p>}
        </td>
        <td className="max-w-[260px] px-4 py-3">
          <OperatorContacts op={op} canSee={canSee} compact />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <form action={setRegisterStatus}>
              <StatusSelect nr={rental.rnal_nr} status={status} />
            </form>
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              aria-expanded={notesOpen}
              aria-label={tracking?.notes ? "Edit notes" : "Add notes"}
              className={cn("grid h-8 w-8 place-items-center rounded-full border transition", tracking?.notes ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:border-slate-300")}
            >
              <StickyNote className="h-3.5 w-3.5" />
            </button>
          </div>
          {tracking?.notes && !notesOpen && <p className="mt-1.5 max-w-[24ch] truncate text-[12px] text-slate-500">{tracking.notes}</p>}
        </td>
      </tr>
      {notesOpen && (
        <tr>
          <td colSpan={5} className="bg-slate-50/70 px-4 py-3">
            <Notes nr={rental.rnal_nr} notes={tracking?.notes ?? null} onDone={() => setNotesOpen(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

/** Phones: the same data as a card. */
export function RegisterCard({ rental, contact, canSee }: { rental: RegisterRentalWithTracking; contact: RegisterContact | undefined; canSee: boolean }) {
  const tracking = rental.register_tracking[0];
  const status: LeadStatus = tracking?.status ?? "new";
  const [notesOpen, setNotesOpen] = useState(false);
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
        <Role role={rental.operator_role} kind={rental.operator_kind} />
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
        <OperatorContacts op={op} canSee={canSee} />
        {canSee && contact?.address && <p className="mt-1.5 text-[12px] text-slate-500">{contact.address}</p>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <form action={setRegisterStatus}>
            <StatusSelect nr={rental.rnal_nr} status={status} />
          </form>
          <button type="button" onClick={() => setNotesOpen((v) => !v)} aria-expanded={notesOpen} aria-label="Notes" className={cn("grid h-8 w-8 place-items-center rounded-full border", tracking?.notes ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500")}>
            <StickyNote className="h-3.5 w-3.5" />
          </button>
        </div>
        <a href={rental.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700">
          Official record <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      {notesOpen && (
        <div className="mt-3">
          <Notes nr={rental.rnal_nr} notes={tracking?.notes ?? null} onDone={() => setNotesOpen(false)} />
        </div>
      )}
    </li>
  );
}
