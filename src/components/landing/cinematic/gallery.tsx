"use client";

import Image from "next/image";
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { flushSync } from "react-dom";
import {
  Bath,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Ruler,
} from "lucide-react";
import {
  BUDGETS,
  DISTRICTS,
  SHOWCASE_IS_SAMPLE,
  type ShowcaseHome,
} from "@/data/portugal-showcase";
import { formatNumber, formatPrice } from "@/lib/format";
import { unsplashBlur } from "@/lib/image-loader";
import { cn } from "@/lib/utils";
import { EASE, gsap, revealLines, useMotion } from "./motion";
import { useSlideIntro } from "./slides";

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

/** Card height follows the viewport so the whole slide fits without scrolling. */
const CARD_H = "clamp(240px, 42dvh, 520px)";

/**
 * Every home on the network, in one screen: filters on top, a horizontal
 * row of photo cards sized to the viewport height below. Filter changes
 * re-sort in place with View Transitions; cards tilt in 3D under a mouse.
 */
export function Gallery({
  slide,
  homes,
  district,
  onDistrict,
  onOpen,
}: {
  slide: number;
  homes: ShowcaseHome[];
  district: string;
  onDistrict: (d: string) => void;
  onOpen: (home: ShowcaseHome) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  // Mouse drag scrolls the row (touch already pans natively); a drag must not count as a click on a card.
  const dragging = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  function onTrackPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragging.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
  }
  function onTrackPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragging.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      e.currentTarget.style.scrollSnapType = "none";
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    e.currentTarget.scrollLeft = d.left - dx;
  }
  function onTrackPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragging.current;
    dragging.current = null;
    if (!d?.moved) return;
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
    // Settle on the nearest card, then hand snapping back to the browser.
    const el = e.currentTarget;
    const base = el.getBoundingClientRect().left;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
    const pos = (c: HTMLElement) => c.getBoundingClientRect().left - base + el.scrollLeft - pad;
    const nearest = cards.reduce<HTMLElement | null>((best, c) => (!best || Math.abs(pos(c) - el.scrollLeft) < Math.abs(pos(best) - el.scrollLeft) ? c : best), null);
    if (nearest) el.scrollTo({ left: pos(nearest), behavior: reduced ? "auto" : "smooth" });
    window.setTimeout(() => (el.style.scrollSnapType = ""), 600);
  }
  const [budget, setBudget] = useState<number | null>(null);
  const { reduced } = useMotion();

  const filtered = useMemo(
    () =>
      homes.filter(
        (h) =>
          (district === "All" || h.district === district) &&
          (budget == null || h.price <= budget),
      ),
    [homes, district, budget],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: homes.length };
    for (const h of homes) c[h.district] = (c[h.district] ?? 0) + 1;
    return c;
  }, [homes]);

  useSlideIntro(slide, root, () => {
    const tl = gsap.timeline({ delay: 0.2, defaults: { ease: EASE.out } });
    revealLines(root.current?.querySelector("h2") ?? null, 0, tl);
    tl.from(
      "[data-gallery-sub], [data-gallery-filters]",
      { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.08 },
      0.25,
    );
    tl.from(
      "[data-card]",
      { x: 60, autoAlpha: 0, duration: 0.9, stagger: 0.06 },
      0.35,
    );
  });

  function apply(fn: () => void) {
    const doc = document as DocWithVT;
    if (doc.startViewTransition && !reduced)
      doc.startViewTransition(() => flushSync(fn));
    else fn();
    track.current?.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" });
  }
  function page(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({
      left: dir * step * (window.innerWidth >= 1024 ? 2 : 1),
      behavior: "smooth",
    });
  }

  return (
    <div
      ref={root}
      className="flex min-h-full flex-col justify-center bg-limestone pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 text-ink sm:pt-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-[min(2.1rem,5vh)] leading-[1.04] tracking-tight sm:text-[min(2.8rem,6vh)] lg:text-[min(3.2rem,6.5vh)]">
              Every home on the network, in one place.
            </h2>
            <p
              data-gallery-sub
              className="mt-2 hidden max-w-[52ch] text-[clamp(14px,2vh,17px)] leading-relaxed text-ink/75 sm:block"
            >
              Pick a region and a budget. Each card is a home an agency is
              holding right now; the exact address stays private until an agent
              agrees terms.
            </p>
          </div>
          <div className="hidden items-center gap-2 lg:flex lg:pb-1">
            <p
              className="whitespace-nowrap text-[14px] text-ink/75 tabular-nums"
              aria-live="polite"
            >
              {filtered.length} home{filtered.length === 1 ? "" : "s"}
            </p>
            {filtered.length > 2 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => page(-1)}
                  aria-label="Previous homes"
                  className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-white/70 text-ink transition hover:border-ink/35 active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => page(1)}
                  aria-label="Next homes"
                  className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-white/70 text-ink transition hover:border-ink/35 active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          data-gallery-filters
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div
            role="group"
            aria-label="District"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
          >
            {["All", ...DISTRICTS].map((d) => {
              const active = district === d;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  onClick={() => apply(() => onDistrict(d))}
                  className={cn(
                    "chip inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[14px] transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
                    active
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-ink/15 bg-white/60 text-ink hover:border-ink/35",
                  )}
                >
                  {d === "All" ? "All of Portugal" : d}
                  <span
                    className={cn(
                      "text-[12px] tabular-nums",
                      active ? "text-white/80" : "text-ink/65",
                    )}
                  >
                    {counts[d] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3">
            <select
              aria-label="Budget"
              value={budget ?? ""}
              onChange={(e) =>
                apply(() =>
                  setBudget(e.target.value ? Number(e.target.value) : null),
                )
              }
              className="!h-9 !w-auto shrink-0 !rounded-full !border-ink/15 !bg-white/60 !pl-3.5 !text-[14px] !text-ink !shadow-none hover:!border-ink/35"
            >
              {BUDGETS.map((b) => (
                <option key={b.label} value={b.max ?? ""}>
                  {b.label}
                </option>
              ))}
            </select>
            <p className="whitespace-nowrap text-[14px] text-ink/75 tabular-nums lg:hidden">
              {filtered.length} home{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      {/* The row: horizontal, snapping, sized by viewport height */}
      <div
        className="mx-auto mt-4 w-full max-w-7xl"
        style={{ ["--card-h" as string]: CARD_H } as CSSProperties}
      >
        <div
          ref={track}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={onTrackPointerEnd}
          onPointerCancel={onTrackPointerEnd}
          onClickCapture={(e) => {
            if (suppressClick.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-6 sm:px-6 lg:scroll-px-8 lg:px-8 lg:[perspective:1400px]"
        >
          {filtered.map((home) => (
            <Card
              key={home.id}
              home={home}
              onOpen={() => onOpen(home)}
              tilt={!reduced}
            />
          ))}
          {filtered.length === 0 && (
            <div className="flex h-[var(--card-h)] w-full flex-col items-start justify-center rounded-[20px] bg-sand/60 p-6">
              <p className="font-display text-2xl text-ink">
                Nothing in {district === "All" ? "Portugal" : district} at this
                budget yet.
              </p>
              <p className="mt-2 max-w-md text-[15px] text-ink/70">
                Raise the budget or pick another region. Agencies add homes
                every week.
              </p>
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
        {SHOWCASE_IS_SAMPLE && (
          <p className="mt-1.5 px-4 text-[12px] text-ink/70 sm:px-6 lg:px-8">
            Sample homes shown while the Portugal listings feed is connected.
          </p>
        )}
      </div>
    </div>
  );
}

function Card({
  home,
  onOpen,
  tilt,
}: {
  home: ShowcaseHome;
  onOpen: () => void;
  tilt: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const setters = useRef<{
    rx: (v: number) => void;
    ry: (v: number) => void;
    gx: (v: number) => void;
    gy: (v: number) => void;
  } | null>(null);

  function ensure() {
    if (!setters.current && ref.current) {
      const el = ref.current;
      setters.current = {
        rx: gsap.quickTo(el, "rotationX", {
          duration: 0.5,
          ease: "power3.out",
        }),
        ry: gsap.quickTo(el, "rotationY", {
          duration: 0.5,
          ease: "power3.out",
        }),
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
      className="h-[var(--card-h)] w-[calc(var(--card-h)*0.8)] shrink-0 snap-start"
    >
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={
          {
            transformStyle: "preserve-3d",
            ["--gx" as string]: "50",
            ["--gy" as string]: "50",
          } as CSSProperties
        }
        className="group relative h-full w-full will-change-transform"
      >
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${home.title}, ${formatPrice(home.price)}, ${home.locality}`}
          className="relative block h-full w-full overflow-hidden rounded-[22px] bg-sand text-left shadow-[0_1px_2px_rgba(20,33,61,0.06)] transition-shadow duration-300 hover:shadow-[0_28px_60px_-28px_rgba(20,33,61,0.55)] active:scale-[0.99]"
        >
          <Image
            src={home.photos[0]}
            alt=""
            fill
            sizes="(min-width: 1024px) 420px, 80vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            placeholder="blur"
            blurDataURL={unsplashBlur(home.photos[0])}
          />
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-ink/85 via-ink/35 to-transparent" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(420px circle at calc(var(--gx) * 1%) calc(var(--gy) * 1%), rgba(248,247,243,0.18), transparent 60%)",
            }}
          />
          <span className="absolute right-3 top-3 rounded-full bg-limestone/90 px-2.5 py-1 text-[12px] font-medium text-ink backdrop-blur">
            {home.type}
          </span>
          <div
            className="absolute inset-x-0 bottom-0 p-4 text-limestone"
            style={{ transform: "translateZ(30px)" }}
          >
            <p className="font-display text-[min(1.75rem,3.4vh)] leading-none tracking-tight">
              {formatPrice(home.price)}
            </p>
            <p className="mt-2 line-clamp-1 text-[14px] font-medium">
              {home.title}
            </p>
            <p className="text-[13px] text-limestone/75">
              {home.locality}, {home.district}
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-limestone/85">
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
                  <Ruler className="h-3.5 w-3.5" />{" "}
                  {formatNumber(home.sqm, " m²")}
                </li>
              )}
            </ul>
          </div>
        </button>
      </div>
    </article>
  );
}
