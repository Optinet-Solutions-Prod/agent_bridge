"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { flushSync } from "react-dom";
import { Bath, BedDouble, Ruler } from "lucide-react";
import { BUDGETS, DISTRICTS, SHOWCASE_IS_SAMPLE, type ShowcaseHome } from "@/data/portugal-showcase";
import { formatNumber, formatPrice } from "@/lib/format";
import { unsplashBlur } from "@/lib/image-loader";
import { cn } from "@/lib/utils";
import { EASE, ScrollTrigger, gsap, useGSAP, useMotion } from "./motion";

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

/**
 * Every home on the network. A snap carousel on phones, a bento grid with
 * 3D tilt on larger screens; filter changes re-sort in place with View
 * Transitions, and cards rise in as they enter the viewport.
 */
export function Gallery({
  id,
  homes,
  district,
  onDistrict,
  onOpen,
}: {
  id: string;
  homes: ShowcaseHome[];
  district: string;
  onDistrict: (d: string) => void;
  onOpen: (home: ShowcaseHome) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const { reduced } = useMotion();

  const filtered = useMemo(
    () => homes.filter((h) => (district === "All" || h.district === district) && (budget == null || h.price <= budget)),
    [homes, district, budget],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: homes.length };
    for (const h of homes) c[h.district] = (c[h.district] ?? 0) + 1;
    return c;
  }, [homes]);

  useGSAP(
    () => {
      if (reduced) return;
      gsap.from("[data-gallery-head] > :not(h2)", {
        y: 28,
        autoAlpha: 0,
        duration: 0.9,
        ease: EASE.out,
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
      });
      const batch = ScrollTrigger.batch("[data-card]", {
        start: "top 92%",
        once: true,
        onEnter: (els) => gsap.fromTo(els, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: EASE.out, stagger: 0.07, overwrite: true }),
      });
      return () => batch.forEach((t) => t.kill());
    },
    { scope: root, dependencies: [reduced] },
  );

  function apply(fn: () => void) {
    const doc = document as DocWithVT;
    if (doc.startViewTransition && !reduced) doc.startViewTransition(() => flushSync(fn));
    else fn();
  }

  return (
    <section
      id={id}
      ref={root}
      data-section="gallery"
      aria-labelledby="gallery-heading"
      className="relative z-20 -mt-[100vh] overflow-hidden bg-limestone py-20 text-ink shadow-[0_-40px_80px_-40px_rgba(20,33,61,0.7)] sm:py-28"
      style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40 }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-gallery-head className="max-w-3xl">
          <h2 id="gallery-heading" data-reveal className="font-display text-[2.2rem] leading-[1.04] tracking-tight sm:text-[3rem] lg:text-[3.6rem]">
            Every home on the network, in one place.
          </h2>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-ink/75">
            Pick a region and a budget. Each card is a home an agency is holding right now; the exact address stays private until an agent agrees terms.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="District" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
            {["All", ...DISTRICTS].map((d) => {
              const active = district === d;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  onClick={() => apply(() => onDistrict(d))}
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
          <div className="flex items-center gap-3">
            <select
              aria-label="Budget"
              value={budget ?? ""}
              onChange={(e) => apply(() => setBudget(e.target.value ? Number(e.target.value) : null))}
              className="!h-10 !w-auto !rounded-full !border-ink/15 !bg-white/60 !pl-4 !text-[15px] !text-ink !shadow-none hover:!border-ink/35"
            >
              {BUDGETS.map((b) => (
                <option key={b.label} value={b.max ?? ""}>
                  {b.label}
                </option>
              ))}
            </select>
            <p className="whitespace-nowrap text-[15px] text-ink/75 tabular-nums" aria-live="polite">
              {filtered.length} home{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl lg:px-8">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-6 sm:px-6 lg:grid lg:auto-rows-[minmax(0,1fr)] lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:[perspective:1400px]">
          {filtered.map((home, i) => (
            <Card key={home.id} home={home} featured={i % 7 === 0} onOpen={() => onOpen(home)} tilt={!reduced} />
          ))}
          {filtered.length === 0 && (
            <div className="flex min-h-[320px] w-full flex-col items-start justify-center rounded-[20px] bg-sand/60 p-6 lg:col-span-3">
              <p className="font-display text-2xl text-ink">Nothing in {district === "All" ? "Portugal" : district} at this budget yet.</p>
              <p className="mt-2 max-w-md text-[15px] text-ink/70">Raise the budget or pick another region. Agencies add homes every week.</p>
              <button type="button" onClick={() => apply(() => setBudget(null))} className="mt-5 inline-flex h-10 items-center rounded-full bg-ink px-4 text-[15px] font-medium text-limestone active:scale-[0.97]">
                Show any budget
              </button>
            </div>
          )}
        </div>
        {SHOWCASE_IS_SAMPLE && <p className="mt-4 px-4 text-[13px] text-ink/70 sm:px-6 lg:px-0">Sample homes shown while the Portugal listings feed is connected.</p>}
      </div>
    </section>
  );
}

function Card({ home, featured, onOpen, tilt }: { home: ShowcaseHome; featured: boolean; onOpen: () => void; tilt: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const setters = useRef<{ rx: (v: number) => void; ry: (v: number) => void; gx: (v: number) => void; gy: (v: number) => void } | null>(null);

  function ensure() {
    if (!setters.current && ref.current) {
      const el = ref.current;
      setters.current = {
        rx: gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" }),
        ry: gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" }),
        gx: gsap.quickTo(el, "--gx", { duration: 0.5, ease: "power3.out" }),
        gy: gsap.quickTo(el, "--gy", { duration: 0.5, ease: "power3.out" }),
      };
    }
    return setters.current;
  }
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!tilt || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const s = ensure();
    s?.ry((x - 0.5) * 9);
    s?.rx((0.5 - y) * 9);
    s?.gx(x * 100);
    s?.gy(y * 100);
  }
  function onLeave() {
    const s = setters.current;
    s?.rx(0);
    s?.ry(0);
  }

  return (
    <article
      data-card
      style={{ viewTransitionName: `home-${home.id}` }}
      className={cn("w-[78vw] max-w-[340px] shrink-0 snap-start lg:w-auto lg:max-w-none", featured && "lg:col-span-2 lg:row-span-2")}
    >
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ transformStyle: "preserve-3d", ["--gx" as string]: "50", ["--gy" as string]: "50" } as React.CSSProperties}
        className="group relative h-full will-change-transform"
      >
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${home.title}, ${formatPrice(home.price)}, ${home.locality}`}
          className={cn(
            "relative block h-full w-full overflow-hidden rounded-[22px] bg-sand text-left shadow-[0_1px_2px_rgba(20,33,61,0.06)] transition-shadow duration-300 hover:shadow-[0_28px_60px_-28px_rgba(20,33,61,0.55)] active:scale-[0.99]",
            featured ? "aspect-[4/5] lg:aspect-auto lg:min-h-[560px]" : "aspect-[4/5]",
          )}
        >
          <Image
            src={home.photos[0]}
            alt=""
            fill
            sizes={featured ? "(min-width: 1024px) 760px, 78vw" : "(min-width: 1024px) 380px, 78vw"}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            placeholder="blur"
            blurDataURL={unsplashBlur(home.photos[0])}
          />
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-ink/85 via-ink/35 to-transparent" />
          {/* Glare that follows the pointer */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: "radial-gradient(420px circle at calc(var(--gx) * 1%) calc(var(--gy) * 1%), rgba(248,247,243,0.18), transparent 60%)" }}
          />
          <span className="absolute right-3 top-3 rounded-full bg-limestone/90 px-2.5 py-1 text-[12px] font-medium text-ink backdrop-blur">{home.type}</span>
          <div className="absolute inset-x-0 bottom-0 p-4 text-limestone sm:p-5" style={{ transform: "translateZ(30px)" }}>
            <p className={cn("font-display leading-none tracking-tight", featured ? "text-[28px] lg:text-[40px]" : "text-[28px]")}>{formatPrice(home.price)}</p>
            <p className={cn("mt-2 font-medium", featured ? "line-clamp-2 text-[15px] lg:text-lg" : "line-clamp-1 text-[15px]")}>{home.title}</p>
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
        </button>
      </div>
    </article>
  );
}
