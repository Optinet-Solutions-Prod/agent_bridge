"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Bath, BedDouble, ChevronLeft, ChevronRight, Ruler, X } from "lucide-react";
import { BUDGETS, DISTRICTS, SHOWCASE_IS_SAMPLE, type ShowcaseHome } from "@/data/portugal-showcase";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

/**
 * The working part of the hero: pick a district and a budget, the row of
 * homes re-sorts in place (View Transitions where supported). Native
 * scroll-snap carries the carousel so the browser's own physics do the work.
 */
export function Showcase({ homes }: { homes: ShowcaseHome[] }) {
  const [district, setDistrict] = useState<string>("All");
  const [budget, setBudget] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState<ShowcaseHome | null>(null);
  const track = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => homes.filter((h) => (district === "All" || h.district === district) && (budget == null || h.price <= budget)),
    [homes, district, budget],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: homes.length };
    for (const h of homes) c[h.district] = (c[h.district] ?? 0) + 1;
    return c;
  }, [homes]);
  const agencies = new Set(filtered.map((h) => h.agency)).size;

  function apply(fn: () => void) {
    setTouched(true);
    const doc = document as DocWithVT;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (doc.startViewTransition && !reduce) doc.startViewTransition(() => flushSync(fn));
    else fn();
    track.current?.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function page(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * (window.innerWidth >= 1024 ? 2 : 1), behavior: "smooth" });
  }

  return (
    <div className="mt-8 sm:mt-10">
      {/* Districts */}
      <div role="group" aria-label="District" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {["All", ...DISTRICTS].map((d) => {
          const active = district === d;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={active}
              onClick={() => apply(() => setDistrict(d))}
              className={cn(
                "chip inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
                active ? "border-brand-700 bg-brand-700 text-white" : "border-ink/15 bg-white/60 text-ink hover:border-ink/35",
              )}
            >
              {d === "All" ? "All of Portugal" : d}
              <span className={cn("text-[13px] tabular-nums", active ? "text-white/80" : "text-ink/65")}>{counts[d] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* Budget + count + desktop paging */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[15px] text-ink/75">
          <span className="hidden sm:inline">Budget</span>
          <select
            aria-label="Budget"
            value={budget ?? ""}
            onChange={(e) => apply(() => setBudget(e.target.value ? Number(e.target.value) : null))}
            className="!h-10 !w-auto !rounded-full !border-ink/15 !bg-white/60 !pl-4 !text-[15px] !text-ink !shadow-none hover:!border-ink/35 focus:!ring-brand-700/15"
          >
            {BUDGETS.map((b) => (
              <option key={b.label} value={b.max ?? ""}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-4">
          <p className="text-[15px] text-ink/75 tabular-nums" aria-live="polite">
            {filtered.length} home{filtered.length === 1 ? "" : "s"}
            {agencies > 0 && (
              <>
                {" "}
                from {agencies} agenc{agencies === 1 ? "y" : "ies"}
              </>
            )}
          </p>
          {filtered.length > 2 && (
            <div className="hidden gap-2 lg:flex">
              <button type="button" onClick={() => page(-1)} aria-label="Previous homes" className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-white/70 text-ink transition hover:border-ink/35 active:scale-95">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => page(1)} aria-label="Next homes" className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-white/70 text-ink transition hover:border-ink/35 active:scale-95">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Carousel */}
      <div className="relative mt-5 sm:mt-6">
        <div
          ref={track}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
          style={{ scrollbarGutter: "stable" }}
        >
          {filtered.map((home, i) => (
            <HomeCard key={home.id} home={home} index={i} animateIn={!touched} onOpen={() => setOpen(home)} />
          ))}
          {filtered.length === 0 && (
            <div className="flex min-h-[320px] w-full flex-col items-start justify-center rounded-[20px] bg-sand/60 p-6 sm:min-h-[420px]">
              <p className="font-display text-2xl text-ink">Nothing in {district === "All" ? "Portugal" : district} at this budget yet.</p>
              <p className="mt-2 max-w-md text-[15px] text-ink/70">Raise the budget or pick another district. Agencies add homes every week.</p>
              <button
                type="button"
                onClick={() => apply(() => setBudget(null))}
                className="mt-5 inline-flex h-10 items-center rounded-full bg-ink px-4 text-[15px] font-medium text-limestone active:scale-[0.97]"
              >
                Show any budget
              </button>
            </div>
          )}
        </div>

      </div>

      {SHOWCASE_IS_SAMPLE && (
        <p className="mt-3 text-[13px] text-ink/70">Sample homes shown while the Portugal listings feed is connected.</p>
      )}

      {open && <HomeSheet home={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function HomeCard({ home, index, animateIn, onOpen }: { home: ShowcaseHome; index: number; animateIn: boolean; onOpen: () => void }) {
  return (
    <article
      data-card
      style={{ viewTransitionName: `home-${home.id}`, animationDelay: animateIn ? `${320 + Math.min(index, 4) * 70}ms` : undefined }}
      className={cn("group relative w-[78vw] max-w-[340px] shrink-0 snap-start sm:w-[320px] lg:w-[340px]", animateIn && index < 5 && "slide-in-right")}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${home.title}, ${formatPrice(home.price)}, ${home.locality}`}
        className="block w-full overflow-hidden rounded-[20px] bg-sand text-left shadow-[0_1px_2px_rgba(20,33,61,0.06)] transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[0_18px_40px_-20px_rgba(20,33,61,0.45)] active:scale-[0.985]"
      >
        <div className="relative aspect-[4/5]">
          <Image
            src={home.photos[0]}
            alt=""
            fill
            sizes="(min-width: 1024px) 340px, (min-width: 640px) 320px, 78vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            priority={index < 4}
          />
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-ink/85 via-ink/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-limestone sm:p-5">
            <p className="font-display text-[28px] leading-none tracking-tight">{formatPrice(home.price)}</p>
            <p className="mt-2 line-clamp-1 text-[15px] font-medium">{home.title}</p>
            <p className="text-[14px] text-limestone/75">
              {home.locality}, {home.district}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-limestone/85">
              {home.beds != null && (
                <li className="inline-flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5" /> {home.beds}
                </li>
              )}
              {home.baths != null && (
                <li className="inline-flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5" /> {home.baths}
                </li>
              )}
              {home.sqm != null && (
                <li className="inline-flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5" /> {formatNumber(home.sqm, " m²")}
                </li>
              )}
            </ul>
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-limestone/90 px-2.5 py-1 text-[12px] font-medium text-ink backdrop-blur">{home.type}</span>
        </div>
      </button>
    </article>
  );
}

function HomeSheet({ home, onClose }: { home: ShowcaseHome; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showModal();
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="sheet fixed inset-0 m-auto w-[min(100vw-1.5rem,760px)] max-w-none overflow-hidden rounded-[24px] bg-limestone p-0 text-ink shadow-2xl backdrop:bg-transparent"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={home.title}
    >
      <div className="grid max-h-[88dvh] overflow-y-auto sm:grid-cols-[1.15fr_1fr]" style={{ overscrollBehavior: "contain" }}>
        <div className="relative aspect-[4/3] bg-sand sm:aspect-auto sm:min-h-[480px]">
          <Image src={home.photos[photo] ?? home.photos[0]} alt="" fill sizes="(min-width: 640px) 440px, 100vw" className="object-cover" />
          {home.photos.length > 1 && (
            <div className="absolute inset-x-0 bottom-1 flex justify-center">
              {home.photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Photo ${i + 1} of ${home.photos.length}`}
                  aria-current={i === photo}
                  onClick={() => setPhoto(i)}
                  className="grid h-10 min-w-6 place-items-center px-1"
                >
                  <span className={cn("block h-1.5 rounded-full transition-[width,background-color] duration-200", i === photo ? "w-6 bg-limestone" : "w-1.5 bg-limestone/55")} />
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-ink/60 text-limestone backdrop-blur transition hover:bg-ink/80 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col p-5 sm:p-7">
          <p className="font-display text-[34px] leading-none tracking-tight">{formatPrice(home.price)}</p>
          <h3 className="mt-3 text-lg font-medium leading-snug">{home.title}</h3>
          <p className="text-[15px] text-ink/75">
            {home.type} in {home.locality}, {home.district}
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-ink/10 py-4 text-[15px]">
            <div>
              <dt className="text-ink/70">Bedrooms</dt>
              <dd className="mt-0.5 font-medium">{home.beds ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink/70">Bathrooms</dt>
              <dd className="mt-0.5 font-medium">{home.baths ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink/70">Interior</dt>
              <dd className="mt-0.5 font-medium">{home.sqm != null ? formatNumber(home.sqm, " m²") : "—"}</dd>
            </div>
          </dl>
          <p className="mt-5 text-[15px] leading-relaxed text-ink/85">{home.blurb}</p>
          <p className="mt-4 text-[13px] text-ink/70">Listed by a verified agency on AgentBridge. The exact address is shared once terms are agreed.</p>
          <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
            <Link href="/dashboard" className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-brand-700 px-5 text-[15px] font-medium text-white transition hover:bg-brand-800 active:scale-[0.98]">
              Ask about this home
            </Link>
            <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-[15px] font-medium text-ink transition hover:border-ink/35 active:scale-[0.98]">
              Keep browsing
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
