"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, StickyNote } from "lucide-react";
import { saveSourceNotes, setSourceStatus } from "@/app/(app)/leads/actions";
import { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/constants";
import type { LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = "register" | "tourism";

function StatusSelect({ status }: { status: LeadStatus }) {
  const { pending } = useFormStatus();
  return (
    <div className="relative">
      <select
        name="status"
        aria-label="My status"
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

/** My status dropdown plus a notes toggle; `renderNotes` decides where the notes editor goes. */
export function useTracking(kind: Kind, id: string, status: LeadStatus, notes: string | null) {
  const [open, setOpen] = useState(false);
  const controls = (
    <div className="flex items-center gap-2">
      <form action={setSourceStatus}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <StatusSelect status={status} />
      </form>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={notes ? "Edit notes" : "Add notes"}
        className={cn("grid h-8 w-8 place-items-center rounded-full border transition", notes ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500 hover:border-slate-300")}
      >
        <StickyNote className="h-3.5 w-3.5" />
      </button>
    </div>
  );
  const editor = open ? (
    <form action={saveSourceNotes} onSubmit={() => setTimeout(() => setOpen(false), 300)} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <textarea name="notes" defaultValue={notes ?? ""} rows={2} placeholder="Private notes: called, left a message, owner open to selling…" className="!min-h-0 flex-1 text-sm" />
      <SaveNotes />
    </form>
  ) : null;
  return { controls, editor, open };
}
