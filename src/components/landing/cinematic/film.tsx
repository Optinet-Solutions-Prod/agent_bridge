"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeft, ArrowRight, Bath, BedDouble, Ruler, Trees } from "lucide-react";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { formatNumber, formatPrice } from "@/lib/format";
import { unsplashBlur } from "@/lib/image-loader";
import { cn } from "@/lib/utils";
import { EASE, gsap, useMotion } from "./motion";
import { useSlideIntro } from "./slides";

/**
 * The featured homes, one full-screen frame at a time, navigated sideways:
 * a horizontal wheel, a drag or swipe from right to left, the arrow keys or
 * the arrows on screen move to the next home. Vertical movement is left to
 * the slide deck, so scrolling down still goes to the next section.
 */

const DURATION = 0.85;
const LOCK_MS = 350;
const WHEEL_THRESHOLD = 48;
const SWIPE_THRESHOLD = 44;

function countUp(layer: HTMLElement, price: number, tl: gsap.core.Timeline, at: number) {
  const el = layer.querySelector<HTMLElement>("[data-film-price]");
  if (!el) return;
  const counter = { v: price * 0.8 };
  tl.to(
    counter,
    {
      v: price,
      duration: 1.1,
      ease: "power2.out",
      onUpdate: () => (el.textContent = formatPrice(Math.round(counter.v / 1000) * 1000)),
      onComplete: () => (el.textContent = formatPrice(price)),
    },
    at,
  );
}

export function Film({ slide, homes, onOpen }: { slide: number; homes: ShowcaseHome[]; onOpen: (home: ShowcaseHome) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const lock = useRef(false);
  const wheelAcc = useRef(0);
  const wheelTimer = useRef<number | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const { reduced } = useMotion();
  const total = homes.length;

  const layer = useCallback((i: number) => root.current?.querySelector<HTMLElement>(`[data-film-layer="${i}"]`) ?? null, []);

  // Entering the section: show the current home and run its intro.
  const active = useSlideIntro(slide, root, () => {
    const i = indexRef.current;
    homes.forEach((_, k) => gsap.set(layer(k), { autoAlpha: k === i ? 1 : 0, xPercent: 0 }));
    const inn = layer(i);
    if (!inn) return;
    gsap.fromTo(inn.querySelector("[data-film-photo]"), { scale: 1.1 }, { scale: 1, duration: 8, ease: "power1.out" });
    const tl = gsap.timeline({ defaults: { ease: EASE.out }, delay: 0.25 });
    tl.from(inn.querySelectorAll("[data-film-copy] > *"), { y: 28, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0);
    countUp(inn, homes[i].price, tl, 0.3);
    tl.from("[data-film-controls], [data-film-hint]", { autoAlpha: 0, y: -8, duration: 0.8 }, 0.6);
  });

  const go = useCallback(
    (dir: 1 | -1) => {
      const from = indexRef.current;
      const to = from + dir;
      if (to < 0 || to >= total || lock.current) return;
      const out = layer(from);
      const inn = layer(to);
      if (!out || !inn) return;
      lock.current = true;
      indexRef.current = to;
      setIndex(to);
      const finish = () => {
        gsap.set(out, { autoAlpha: 0, xPercent: 0 });
        window.setTimeout(() => {
          lock.current = false;
          wheelAcc.current = 0;
        }, LOCK_MS);
      };
      if (reduced) {
        gsap.set(inn, { autoAlpha: 1, xPercent: 0 });
        finish();
        return;
      }
      // The slow push-in runs on its own so the lock lifts when the frame has landed, not when the zoom ends.
      gsap.fromTo(inn.querySelector("[data-film-photo]"), { scale: 1.12 }, { scale: 1, duration: 2.6, ease: "power2.out", delay: 0.12 });
      const tl = gsap.timeline();
      tl.to(out, { xPercent: -14 * dir, autoAlpha: 0, duration: DURATION, ease: "power3.inOut" }, 0)
        .to(out.querySelector("[data-film-photo]"), { scale: 1.06, duration: DURATION, ease: "power3.inOut" }, 0)
        .fromTo(inn, { xPercent: 14 * dir, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: DURATION, ease: "power3.out" }, 0.12)
        .from(inn.querySelectorAll("[data-film-copy] > *"), { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.07, ease: EASE.out }, 0.3)
        .call(finish, [], DURATION + 0.12);
      countUp(inn, homes[to].price, tl, 0.4);
    },
    [homes, layer, reduced, total],
  );

  // Sideways input: horizontal wheel on the frame, arrow keys while this section is on screen.
  useEffect(() => {
    const el = root.current;
    if (!el || !active) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || lock.current || document.querySelector("dialog[open]")) return;
      wheelAcc.current += e.deltaX;
      if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => (wheelAcc.current = 0), 220);
      if (Math.abs(wheelAcc.current) >= WHEEL_THRESHOLD) {
        const d: 1 | -1 = wheelAcc.current > 0 ? 1 : -1;
        wheelAcc.current = 0;
        go(d);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [active, go]);

  // Drag or swipe sideways (mouse, pen or finger).
  function onPointerDown(e: ReactPointerEvent) {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: ReactPointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
  }

  return (
    <div
      ref={root}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      className="relative h-full select-none overflow-hidden bg-ink text-limestone [touch-action:pan-y]"
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured homes"
    >
      {homes.map((home, i) => (
        <div
          key={home.id}
          data-film-layer={i}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${total}: ${home.title}`}
          aria-hidden={i !== index}
          inert={i !== index}
          className={cn("absolute inset-0 flex items-end", i !== 0 && "invisible opacity-0")}
        >
          <div data-film-photo className="absolute inset-0 cursor-grab will-change-transform active:cursor-grabbing">
            <Image src={home.photos[0]} alt="" fill sizes="100vw" draggable={false} className="object-cover" placeholder="blur" blurDataURL={unsplashBlur(home.photos[0])} />
          </div>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/5" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/50 via-transparent to-transparent" />

          <div data-film-copy className="relative mx-auto w-full max-w-7xl px-4 pb-[min(4rem,7vh)] pt-24 sm:px-6 lg:px-8">
            <h2 className="max-w-2xl font-display text-[min(2.2rem,5.6vh)] leading-[1.02] tracking-tight sm:text-[min(3.2rem,7vh)] lg:text-[min(4rem,8vh)]">{home.title}</h2>
            <p className="mt-3 text-[15px] text-limestone/80 sm:text-base">
              {home.type} in {home.locality}, {home.district}
            </p>
            <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
              <p data-film-price className="font-display text-[min(2.4rem,5.5vh)] leading-none tracking-tight sm:text-[min(3rem,6.5vh)]">
                {formatPrice(home.price)}
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 pb-1 text-[14px] text-limestone/80">
                {home.beds != null && (
                  <li className="inline-flex items-center gap-1.5">
                    <BedDouble className="h-4 w-4" /> {home.beds} bed
                  </li>
                )}
                {home.baths != null && (
                  <li className="inline-flex items-center gap-1.5">
                    <Bath className="h-4 w-4" /> {home.baths} bath
                  </li>
                )}
                {home.sqm != null && (
                  <li className="inline-flex items-center gap-1.5">
                    <Ruler className="h-4 w-4" /> {formatNumber(home.sqm, " m²")}
                  </li>
                )}
                {home.plotSqm != null && (
                  <li className="inline-flex items-center gap-1.5">
                    <Trees className="h-4 w-4" /> {formatNumber(home.plotSqm, " m²")} plot
                  </li>
                )}
              </ul>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => onOpen(home)} className="inline-flex h-11 items-center rounded-full bg-limestone px-5 text-[15px] font-medium text-ink transition hover:bg-white active:scale-[0.98]">
                See this home
              </button>
              <span className="inline-flex h-11 items-center rounded-full border border-limestone/30 px-4 text-[13px] text-limestone/80">Listed by Agency #{home.agency}</span>
            </div>
          </div>
        </div>
      ))}

      {/* Where you are in the row, and the way to move along it */}
      <div data-film-controls className="absolute right-4 top-[4.25rem] z-10 flex items-center gap-3 sm:right-8 sm:top-[5.25rem]">
        <p className="font-display text-[15px] tabular-nums" aria-live="polite">
          {String(index + 1).padStart(2, "0")}
          <span className="text-limestone/45"> / {String(total).padStart(2, "0")}</span>
        </p>
        <div aria-hidden className="hidden h-[3px] w-24 overflow-hidden rounded-full bg-limestone/25 sm:block">
          <div className="h-full rounded-full bg-limestone transition-[width] duration-500 ease-out" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous home"
            className="grid h-10 w-10 place-items-center rounded-full border border-limestone/35 bg-ink/25 text-limestone backdrop-blur transition-colors hover:bg-ink/45 disabled:opacity-30 disabled:hover:bg-ink/25"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === total - 1}
            aria-label="Next home"
            className="grid h-10 w-10 place-items-center rounded-full border border-limestone/35 bg-ink/25 text-limestone backdrop-blur transition-colors hover:bg-ink/45 disabled:opacity-30 disabled:hover:bg-ink/25"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p data-film-hint className="pointer-events-none absolute bottom-6 right-8 hidden text-[11px] uppercase tracking-[0.2em] text-limestone/55 lg:block">
        Drag sideways for the next home
      </p>
    </div>
  );
}
