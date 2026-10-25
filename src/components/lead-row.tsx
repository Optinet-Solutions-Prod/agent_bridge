"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink, Loader2, StickyNote } from "lucide-react";
import { saveLeadNotes, setLeadStatus } from "@/app/(app)/leads/actions";
import { Badge } from "@/components/ui";
import { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import type { LeadStatus, OwnerLeadWithTracking } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<LeadStatus, "neutral" | "blue" | "amber" | "green" | "red"> = {
  new: "neutral",
  contacted: "blue",
  appointment: "amber",
  listed: "green",
  not_interested: "red",
};

function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const { pending } = useFormStatus();
  return (
    <div className="relative">
      <select
        name="status"
        aria-label="My status for this lead"
        defaultValue={status}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={cn("!h-9 !w-auto !rounded-full !pl-3 !pr-8 text-[13px] font-medium", {
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
      <input type="hidden" name="lead_id" value={leadId} />
      {pending && <Loader2 className="pointer-events-none absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />}
    </div>
  );
}

function SaveNotes() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-[13px] font-medium text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50">
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save notes
    </button>
  );
}

export function LeadRow({ lead }: { lead: OwnerLeadWithTracking }) {
  const tracking = lead.owner_lead_tracking[0];
  const status: LeadStatus = tracking?.status ?? "new";
  const [notesOpen, setNotesOpen] = useState(false);
  const perSqm = lead.offer === "sale" && lead.price_eur && lead.size_sqm ? Math.round(lead.price_eur / lead.size_sqm) : null;
  const extra = Object.entries(lead.extra ?? {});

  return (
    <li className={cn("rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5", status === "not_interested" && "opacity-70")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* What */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-slate-900">
              {lead.typology ?? "—"} in {lead.area}
            </p>
            <Badge tone={lead.offer === "sale" ? "teal" : "blue"}>{lead.offer === "sale" ? "For sale" : "For rent"}</Badge>
            {tracking && status !== "new" && <Badge tone={STATUS_TONE[status]}>{LEAD_STATUS_LABEL[status]}</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {lead.district}
            {lead.size_sqm ? ` · ${formatNumber(lead.size_sqm, " m²")}` : ""}
            {` · ${lead.platform} #${lead.listing_id}`}
            {lead.source_checked_on ? ` · seen ${formatDate(lead.source_checked_on)}` : ""}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Advertiser</dt>
              <dd className="text-slate-800">{lead.advertiser_evidence ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Owner status</dt>
              <dd className="text-slate-800">{lead.owner_status ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone on listing</dt>
              <dd className="text-slate-800">{lead.phone_visibility ?? "—"}</dd>
            </div>
            {extra.slice(0, 6).map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-slate-800">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Price */}
        <div className="shrink-0 lg:w-44 lg:text-right">
          <p className="text-2xl font-semibold tracking-tight text-slate-900">
            {formatPrice(lead.price_eur)}
            {lead.offer === "rent" && lead.price_eur != null && <span className="text-sm font-normal text-slate-500"> /month</span>}
          </p>
          {perSqm && <p className="text-[13px] text-slate-500">{formatPrice(perSqm)} per m²</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <form action={setLeadStatus}>
          <StatusSelect leadId={lead.id} status={status} />
        </form>
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          aria-expanded={notesOpen}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition active:scale-[0.98]",
            tracking?.notes ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
          )}
        >
          <StickyNote className="h-3.5 w-3.5" /> {tracking?.notes ? "Notes" : "Add note"}
        </button>
        {lead.evidence_url && (
          <a
            href={lead.evidence_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-brand-700 transition hover:bg-brand-50"
          >
            Open listing <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {notesOpen && (
        <form action={saveLeadNotes} className="mt-3 space-y-2">
          <input type="hidden" name="lead_id" value={lead.id} />
          <textarea
            name="notes"
            rows={3}
            defaultValue={tracking?.notes ?? ""}
            placeholder="Who you spoke to, what they said, when to call back. Only you can see this."
            aria-label="My notes"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">{tracking?.updated_at ? `Last updated ${formatDate(tracking.updated_at)}` : "Private to your account"}</p>
            <SaveNotes />
          </div>
        </form>
      )}
    </li>
  );
}
