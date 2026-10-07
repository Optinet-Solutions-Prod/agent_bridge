"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Loader2, Plus, X } from "lucide-react";
import { PROPERTY_TYPES, REGIONS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { MatchCriteria } from "@/lib/types";
import { cn } from "@/lib/utils";

const BED_OPTIONS = [null, 1, 2, 3, 4, 5] as const;
const PRICE_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: "Under €300k", min: null, max: 300000 },
  { label: "€300–500k", min: 300000, max: 500000 },
  { label: "€500–800k", min: 500000, max: 800000 },
  { label: "€700–900k", min: 700000, max: 900000 },
  { label: "€800k–1.2M", min: 800000, max: 1200000 },
  { label: "€1.2M+", min: 1200000, max: null },
];

function summary(c: MatchCriteria) {
  const parts: string[] = [];
  parts.push(c.min_bedrooms ? `${c.min_bedrooms}+ beds` : "Any beds");
  parts.push(c.localities.length === 0 ? "anywhere in Malta" : c.localities.length <= 2 ? c.localities.join(", ") : `${c.localities.length} localities`);
  if (c.min_price && c.max_price) parts.push(`${formatPrice(c.min_price)}–${formatPrice(c.max_price)}`);
  else if (c.max_price) parts.push(`up to ${formatPrice(c.max_price)}`);
  else if (c.min_price) parts.push(`from ${formatPrice(c.min_price)}`);
  else parts.push("any budget");
  if (c.property_types.length) parts.push(c.property_types.length <= 2 ? c.property_types.join(" / ") : `${c.property_types.length} types`);
  return parts.join(" · ");
}

/**
 * The client's brief that drives the deck. Edits are written to the URL so the
 * server re-queries; the page remounts this component (via key) when they land.
 */
export function DiscoverBrief({
  requests,
  selectedId,
  criteria,
}: {
  requests: { id: string; title: string }[];
  selectedId: string | null;
  criteria: MatchCriteria;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [showTypes, setShowTypes] = useState(criteria.property_types.length > 0);
  const [localities, setLocalities] = useState(criteria.localities);
  const [types, setTypes] = useState(criteria.property_types);
  const [min, setMin] = useState(criteria.min_price != null ? String(criteria.min_price) : "");
  const [max, setMax] = useState(criteria.max_price != null ? String(criteria.max_price) : "");

  function apply(next: { localities?: string[]; types?: string[]; min?: string; max?: string; beds?: number | null } = {}) {
    const p = new URLSearchParams();
    p.set("request", selectedId ?? "none");
    const L = next.localities ?? localities;
    if (L.length) L.forEach((l) => p.append("loc", l));
    else p.set("loc", "");
    const T = next.types ?? types;
    if (T.length) T.forEach((t) => p.append("type", t));
    else p.set("type", "");
    p.set("min", next.min ?? min);
    p.set("max", next.max ?? max);
    const beds = next.beds === undefined ? criteria.min_bedrooms : next.beds;
    p.set("beds", beds == null ? "" : String(beds));
    startTransition(() => router.replace(`/discover?${p.toString()}`));
  }

  function switchRequest(value: string) {
    startTransition(() => router.replace(`/discover?request=${value}`));
  }

  function addLocality(value: string) {
    if (!value || localities.includes(value)) return;
    const next = [...localities, value];
    setLocalities(next);
    apply({ localities: next });
  }

  function removeLocality(value: string) {
    const next = localities.filter((l) => l !== value);
    setLocalities(next);
    apply({ localities: next });
  }

  function toggleType(value: string) {
    const next = types.includes(value) ? types.filter((t) => t !== value) : [...types, value];
    setTypes(next);
    apply({ types: next });
  }

  return (
    <section
      aria-busy={pending}
      className={cn("mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition", pending && "opacity-70")}
    >
      {/* Who are we swiping for */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-3 sm:px-5">
        <label htmlFor="brief" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Swiping for
        </label>
        <select id="brief" value={selectedId ?? "none"} onChange={(e) => switchRequest(e.target.value)} className="!h-9 !w-auto max-w-[min(100%,320px)] font-medium">
          {requests.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
          <option value="none">Quick brief (no saved client)</option>
        </select>
        <Link href="/requests/new" className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline">
          <Plus className="h-3.5 w-3.5" /> New client brief
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <span className="hidden text-xs text-slate-500 md:inline">{summary(criteria)}</span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-expanded={open}
          >
            {open ? "Hide" : "Edit"} brief <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
          </button>
        </div>
      </div>
      <p className="px-4 pt-2 text-xs text-slate-500 md:hidden">{summary(criteria)}</p>

      {/* Criteria */}
      <div className={cn("grid gap-5 px-4 py-4 sm:px-5 lg:grid-cols-[auto_1fr_auto]", !open && "hidden lg:grid")}>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Bedrooms</p>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {BED_OPTIONS.map((b) => {
              const active = (criteria.min_bedrooms ?? null) === b;
              return (
                <button
                  key={String(b)}
                  type="button"
                  onClick={() => apply({ beds: b })}
                  className={cn("h-8 min-w-9 rounded-lg px-2 text-sm font-medium transition", active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
                >
                  {b === null ? "Any" : `${b}+`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Localities</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {localities.length === 0 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Anywhere in Malta</span>}
            {localities.map((l) => (
              <span key={l} className="inline-flex items-center gap-1 rounded-full bg-teal-50 py-1 pl-2.5 pr-1 text-xs font-medium text-teal-800 ring-1 ring-inset ring-teal-600/20">
                {l}
                <button type="button" onClick={() => removeLocality(l)} aria-label={`Remove ${l}`} className="grid h-5 w-5 place-items-center rounded-full hover:bg-teal-600/15">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <select value="" onChange={(e) => addLocality(e.target.value)} aria-label="Add locality" className="!h-8 !w-auto !rounded-full !py-0 !pl-3 text-xs">
              <option value="">+ Add locality</option>
              {Object.entries(REGIONS).map(([region, towns]) => (
                <optgroup key={region} label={region}>
                  {towns
                    .filter((t) => !localities.includes(t))
                    .map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
            className="flex items-center gap-1.5"
          >
            <input type="number" inputMode="numeric" min={0} step={10000} placeholder="Min €" value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minimum price" className="!h-9 !w-28" />
            <span className="text-slate-400">–</span>
            <input type="number" inputMode="numeric" min={0} step={10000} placeholder="Max €" value={max} onChange={(e) => setMax(e.target.value)} aria-label="Maximum price" className="!h-9 !w-28" />
            <button type="submit" className="h-9 rounded-xl bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800">
              Apply
            </button>
          </form>
          <div className="mt-2 flex flex-wrap gap-1">
            {PRICE_PRESETS.map((p) => {
              const active = (criteria.min_price ?? null) === p.min && (criteria.max_price ?? null) === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setMin(p.min == null ? "" : String(p.min));
                    setMax(p.max == null ? "" : String(p.max));
                    apply({ min: p.min == null ? "" : String(p.min), max: p.max == null ? "" : String(p.max) });
                  }}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                    active ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <button type="button" onClick={() => setShowTypes((v) => !v)} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800">
            Property types {types.length > 0 && <span className="rounded-full bg-teal-700 px-1.5 text-[10px] text-white">{types.length}</span>}
            <ChevronDown className={cn("h-3.5 w-3.5 transition", showTypes && "rotate-180")} />
          </button>
          {showTypes && (
            <div className="mt-2 flex flex-wrap gap-1">
              {PROPERTY_TYPES.map((t) => {
                const active = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                      active ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
              {types.length > 0 && (
                <button type="button" onClick={() => { setTypes([]); apply({ types: [] }); }} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800">
                  Any type
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
