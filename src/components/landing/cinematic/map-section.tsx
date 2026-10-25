"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { DISTRICT_POINTS, FUNCHAL_POINT, MADEIRA_PATH, MADEIRA_VIEWBOX, PORTUGAL_MAINLAND_PATH, PORTUGAL_VIEWBOX } from "@/data/portugal-outline";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { formatDate, formatPrice } from "@/lib/format";
import { unsplashBlur } from "@/lib/image-loader";
import type { OwnerLeadOverview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EASE, gsap, revealLines } from "./motion";
import { useSlideIntro } from "./slides";

const LABEL_PLACEMENT: Record<string, { anchor: "start" | "end"; dx: number; dy: number }> = {
  Sintra: { anchor: "end", dx: -5, dy: -5 },
  Cascais: { anchor: "end", dx: -5, dy: 8 },
  Lisboa: { anchor: "start", dx: 8, dy: 2.2 },
  Comporta: { anchor: "start", dx: 7, dy: 6 },
};

/**
 * Portugal, by the numbers: the outline draws itself, district dots pop in
 * sized by stock, counters count up, and private-owner data for Lisboa
 * grows in as bars. Tap a dot to browse that district.
 */
export function MapSection({ slide, homes, overview, onBrowse }: { slide: number; homes: ShowcaseHome[]; overview: OwnerLeadOverview | null; onBrowse: (district: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [active, setActive] = useState<string | null>(null);

  const byDistrict = useMemo(() => {
    const m: Record<string, ShowcaseHome[]> = {};
    for (const h of homes) (m[h.district] ??= []).push(h);
    return m;
  }, [homes]);
  const agencies = new Set(homes.map((h) => h.agency)).size;
  const districts = Object.keys(byDistrict).length;
  const maxCount = Math.max(...Object.values(byDistrict).map((l) => l.length), 1);
  const areaStats = (overview?.by_area ?? []).filter((a) => a.median_sale_eur_sqm != null).slice(0, 4);
  const maxSqm = Math.max(...areaStats.map((a) => a.median_sale_eur_sqm ?? 0), 1);

  useSlideIntro(slide, root, () => {
    const path = pathRef.current;
    const len = path?.getTotalLength() ?? 0;
    if (path) gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    const tl = gsap.timeline({ delay: 0.2, defaults: { ease: EASE.out } });
    revealLines(root.current?.querySelector("h2") ?? null, 0, tl);
    tl.from("[data-map-sub], [data-map-stats], [data-map-panel]", { y: 28, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0.2)
      .to(path, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" }, 0.1)
      .from("[data-map-fill]", { autoAlpha: 0, duration: 1.2 }, 1.2)
      .from("[data-map-dot]", { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: EASE.back, stagger: 0.09 }, 1.5)
      .from("[data-map-label]", { autoAlpha: 0, y: 6, duration: 0.5, stagger: 0.08 }, 1.8)
      .from("[data-map-inset]", { autoAlpha: 0, y: 10, duration: 0.8 }, 2.0)
      .from("[data-bar]", { scaleX: 0, transformOrigin: "left center", duration: 1, ease: "power3.out", stagger: 0.08 }, 1.0);
    gsap.utils.toArray<HTMLElement>("[data-count]", root.current ?? undefined).forEach((el) => {
      const to = Number(el.dataset.count ?? 0);
      const obj = { v: 0 };
      tl.to(obj, { v: to, duration: 1.4, ease: "power2.out", onUpdate: () => (el.textContent = String(Math.round(obj.v))) }, 0.4);
    });
  });

  const activeHomes = active ? (byDistrict[active] ?? []) : [];

  return (
    <div ref={root} className="flex min-h-full flex-col justify-center bg-sand px-4 pb-10 pt-20 text-ink sm:px-6 sm:pt-24 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-10">
        <div>
          <h2 className="max-w-[16ch] font-display text-[min(2.1rem,5vh)] leading-[1.04] tracking-tight sm:text-[min(2.8rem,6vh)] lg:text-[min(3.4rem,6.8vh)]">Where the network&apos;s stock is, right now.</h2>
          <p data-map-sub className="mt-3 max-w-[46ch] text-[clamp(14px,2vh,17px)] leading-relaxed text-ink/75">
            From the Douro to the Algarve and out to Madeira. Tap a region on the map to see what agencies are holding there.
          </p>
          <dl data-map-stats className="mt-6 grid grid-cols-3 gap-4">
            <div>
              <dt className="text-[13px] text-ink/70">Homes</dt>
              <dd className="mt-1 font-display text-[min(2.4rem,5vh)] leading-none tracking-tight tabular-nums" data-count={homes.length}>
                {homes.length}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink/70">Agencies</dt>
              <dd className="mt-1 font-display text-[min(2.4rem,5vh)] leading-none tracking-tight tabular-nums" data-count={agencies}>
                {agencies}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink/70">Regions</dt>
              <dd className="mt-1 font-display text-[min(2.4rem,5vh)] leading-none tracking-tight tabular-nums" data-count={districts}>
                {districts}
              </dd>
            </div>
          </dl>

          {overview && overview.total > 0 && (
            <div data-map-panel className="mt-6 rounded-[20px] border border-ink/10 bg-white/70 p-4 backdrop-blur-sm sm:p-5">
              <p className="font-display text-lg leading-tight">Owners selling on their own, Lisboa</p>
              <p className="mt-1 text-[13px] text-ink/70">
                {overview.total} public listings by private owners in {overview.areas} parishes{overview.checked_on ? `, checked ${formatDate(overview.checked_on)}` : ""}. Median asking{" "}
                {overview.median_sale_eur_sqm ? `${formatPrice(Math.round(overview.median_sale_eur_sqm))} per m²` : "—"}.
              </p>
              <ul className="mt-3 space-y-2">
                {areaStats.map((a) => (
                  <li key={a.area} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-[13px]">
                    <span className="truncate">{a.area}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-ink/10">
                      <span data-bar className="block h-full rounded-full bg-brand-700" style={{ width: `${((a.median_sale_eur_sqm ?? 0) / maxSqm) * 100}%` }} />
                    </span>
                    <span className="tabular-nums text-ink/80">{formatPrice(Math.round(a.median_sale_eur_sqm ?? 0))}/m²</span>
                  </li>
                ))}
              </ul>
              <Link href="/leads" className="mt-3 inline-flex h-9 items-center rounded-full bg-ink px-4 text-[13px] font-medium text-limestone transition hover:bg-brand-900 active:scale-[0.98]">
                See the leads as an agent
              </Link>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative mx-auto w-full max-w-[min(420px,70vw)] lg:max-w-[min(400px,36vh)]">
          <svg viewBox={PORTUGAL_VIEWBOX} className="h-auto w-full overflow-visible" role="img" aria-label="Map of mainland Portugal with the regions where homes are listed">
            <defs>
              <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1b3f8f" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#1b3f8f" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path data-map-fill d={PORTUGAL_MAINLAND_PATH} fill="#ffffff" fillOpacity="0.9" stroke="none" />
            <path ref={pathRef} d={PORTUGAL_MAINLAND_PATH} fill="none" stroke="#1b3f8f" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {Object.entries(DISTRICT_POINTS).map(([name, p]) => {
              const count = byDistrict[name]?.length ?? 0;
              if (!count) return null;
              const r = 2.6 + (count / maxCount) * 3.6;
              const isActive = active === name;
              const place = LABEL_PLACEMENT[name] ?? { anchor: "start", dx: r + 4, dy: 2.2 };
              return (
                <g
                  key={name}
                  data-map-dot
                  role="button"
                  tabIndex={0}
                  aria-label={`${name}: ${count} home${count === 1 ? "" : "s"}`}
                  className="cursor-pointer outline-none"
                  onPointerEnter={() => setActive(name)}
                  onFocus={() => setActive(name)}
                  onClick={() => setActive(name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onBrowse(name);
                    }
                  }}
                >
                  <circle cx={p.x} cy={p.y} r={r * 3.2} fill="url(#map-glow)" className="map-pulse" style={{ transformOrigin: `${p.x}px ${p.y}px` }} />
                  <circle cx={p.x} cy={p.y} r={r} fill={isActive ? "#0e2a66" : "#1b3f8f"} stroke="#f8f7f3" strokeWidth="1.2" />
                  <text data-map-label x={p.x + place.dx} y={p.y + place.dy} textAnchor={place.anchor} fontSize="6.5" fontWeight="500" fill="#14213d" className="select-none">
                    {name} <tspan fill="#14213d" fillOpacity="0.55">{count}</tspan>
                  </text>
                </g>
              );
            })}
          </svg>

          {byDistrict.Madeira && (
            <button
              type="button"
              data-map-inset
              onPointerEnter={() => setActive("Madeira")}
              onClick={() => setActive("Madeira")}
              className={cn("absolute bottom-0 left-0 w-[30%] rounded-xl border bg-white/80 p-2 text-left backdrop-blur transition-colors", active === "Madeira" ? "border-brand-700" : "border-ink/10")}
              aria-label={`Madeira: ${byDistrict.Madeira.length} homes`}
            >
              <svg viewBox={MADEIRA_VIEWBOX} className="h-auto w-full overflow-visible">
                <path d={MADEIRA_PATH} fill="#ffffff" stroke="#1b3f8f" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                <circle cx={FUNCHAL_POINT.x} cy={FUNCHAL_POINT.y} r="4.5" fill="#1b3f8f" stroke="#f8f7f3" strokeWidth="1.2" />
              </svg>
              <span className="mt-1 block whitespace-nowrap text-[11px] font-medium sm:text-[12px]">
                Madeira <span className="text-ink/55">{byDistrict.Madeira.length}</span>
              </span>
            </button>
          )}

          <div
            className={cn(
              "absolute right-0 top-0 w-[min(100%,240px)] rounded-[18px] border border-ink/10 bg-white/90 p-3 shadow-[0_18px_40px_-20px_rgba(20,33,61,0.4)] backdrop-blur transition-all duration-300",
              active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
            )}
            aria-live="polite"
          >
            {active && activeHomes[0] && (
              <>
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-sand">
                  <Image src={activeHomes[0].photos[0]} alt="" fill sizes="240px" className="object-cover" placeholder="blur" blurDataURL={unsplashBlur(activeHomes[0].photos[0])} />
                </div>
                <p className="mt-2.5 font-display text-lg leading-tight">{active}</p>
                <p className="text-[13px] text-ink/70">
                  {activeHomes.length} home{activeHomes.length === 1 ? "" : "s"}, from {formatPrice(Math.min(...activeHomes.map((h) => h.price)))}
                </p>
                <button type="button" onClick={() => onBrowse(active)} className="mt-2.5 inline-flex h-9 w-full items-center justify-center rounded-full bg-brand-700 text-[13px] font-medium text-white transition hover:bg-brand-800 active:scale-[0.98]">
                  Browse {active}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
