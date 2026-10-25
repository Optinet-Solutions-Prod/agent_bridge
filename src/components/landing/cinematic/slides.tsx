"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { gsap, useGSAP, useMotion } from "./motion";

/**
 * The landing page as a deck of full-screen slides.
 *
 * No document scrolling at all: each slide is exactly the viewport, and a
 * wheel tick, a vertical swipe, an arrow key or a dot moves exactly one slide
 * with a crossfade-and-rise. A slide whose content is taller than the screen
 * scrolls inside itself; it hands off to the next slide only once it has
 * reached its end. Dialogs and the swipe deck's card drag are left alone.
 */

type SlidesContextValue = {
  index: number;
  count: number;
  ids: readonly string[];
  /** Fonts are loaded and the first slide is on screen: safe to run intros. */
  ready: boolean;
  goTo: (target: number | string) => void;
  next: () => void;
  prev: () => void;
};

const SlidesContext = createContext<SlidesContextValue | null>(null);

export function useSlides() {
  const ctx = useContext(SlidesContext);
  if (!ctx) throw new Error("useSlides must be used inside <SlideDeck>");
  return ctx;
}

/**
 * Runs `build` (GSAP tweens, scoped to `scope`) every time `slide` becomes
 * the active one, and reverts it when the slide leaves, so intros replay.
 */
export function useSlideIntro(slide: number, scope: RefObject<HTMLElement | null>, build: () => void, deps: unknown[] = []) {
  const { index, ready } = useSlides();
  const { reduced } = useMotion();
  const active = index === slide;
  useGSAP(
    () => {
      if (!active || !ready || reduced) return;
      build();
    },
    { scope, dependencies: [active, ready, reduced, ...deps], revertOnUpdate: true },
  );
  return active;
}

const DURATION = 0.95;
const LOCK_MS = 500;
const WHEEL_THRESHOLD = 48;
const SWIPE_THRESHOLD = 44;

function scrollerFor(target: EventTarget | null): HTMLElement | null {
  let el = target instanceof Element ? target : null;
  while (el && !(el instanceof HTMLElement && el.hasAttribute("data-slide-scroll"))) el = el.parentElement;
  return el as HTMLElement | null;
}
function canScroll(el: HTMLElement | null, dir: 1 | -1) {
  if (!el) return false;
  const max = el.scrollHeight - el.clientHeight - 1;
  if (max <= 0) return false;
  return dir > 0 ? el.scrollTop < max : el.scrollTop > 0;
}
const insideProtected = (target: EventTarget | null) => target instanceof Element && !!target.closest("[data-no-slide], dialog[open]");
const dialogOpen = () => !!document.querySelector("dialog[open]");

export function SlideDeck({ ids, labels, slides, children }: { ids: readonly string[]; labels: readonly string[]; slides: ReactNode[]; children?: ReactNode }) {
  const { reduced } = useMotion();
  const stage = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const indexRef = useRef(0);
  const lock = useRef(false);
  const wheelAcc = useRef(0);
  const wheelTimer = useRef<number | null>(null);
  const touch = useRef<{ x: number; y: number; upOk: boolean; downOk: boolean } | null>(null);
  const count = ids.length;

  const slideEl = useCallback((i: number) => stage.current?.querySelector<HTMLElement>(`[data-slide-index="${i}"]`) ?? null, []);

  // Lock the document, honour a #hash, wait for fonts before intros.
  useEffect(() => {
    document.documentElement.classList.add("slides-on");
    const fromHash = ids.indexOf(location.hash.replace("#", ""));
    const start = fromHash >= 0 ? fromHash : 0;
    indexRef.current = start;
    ids.forEach((_, i) => {
      const el = slideEl(i);
      if (el) gsap.set(el, { autoAlpha: i === start ? 1 : 0, zIndex: i === start ? 2 : 1 });
    });
    // Syncing with the URL (an external system) once, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (start !== 0) setIndex(start);
    const done = () => setReady(true);
    if ("fonts" in document) document.fonts.ready.then(done);
    else done();
    return () => document.documentElement.classList.remove("slides-on");
  }, [ids, slideEl]);

  const goTo = useCallback(
    (target: number | string) => {
      const i = typeof target === "string" ? ids.indexOf(target) : target;
      const from = indexRef.current;
      if (i < 0 || i >= count || i === from || lock.current) return;
      const out = slideEl(from);
      const inn = slideEl(i);
      if (!out || !inn) return;
      lock.current = true;
      indexRef.current = i;
      setIndex(i);
      history.replaceState(null, "", `#${ids[i]}`);

      const dir: 1 | -1 = i > from ? 1 : -1;
      const outC = out.querySelector<HTMLElement>("[data-slide-scroll]");
      const inC = inn.querySelector<HTMLElement>("[data-slide-scroll]");
      // Enter a tall slide at the end nearest to where you came from.
      if (inC) inC.scrollTop = dir > 0 ? 0 : inC.scrollHeight;

      const finish = () => {
        gsap.set(out, { autoAlpha: 0, zIndex: 1 });
        if (outC) {
          gsap.set(outC, { clearProps: "transform" });
          outC.scrollTop = 0;
        }
        gsap.set(inn, { zIndex: 2 });
        if (inC) gsap.set(inC, { clearProps: "transform" });
        window.setTimeout(() => {
          lock.current = false;
          wheelAcc.current = 0;
        }, LOCK_MS);
      };

      if (reduced) {
        gsap.set(inn, { autoAlpha: 1, zIndex: 3 });
        finish();
        return;
      }
      gsap.set(inn, { autoAlpha: 0, zIndex: 3 });
      const tl = gsap.timeline({ onComplete: finish });
      tl.to(out, { autoAlpha: 0, duration: DURATION * 0.8, ease: "power2.inOut" }, 0.08);
      if (outC) tl.fromTo(outC, { yPercent: 0, scale: 1 }, { yPercent: -7 * dir, scale: 0.96, duration: DURATION, ease: "power3.inOut" }, 0);
      tl.fromTo(inn, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION * 0.8, ease: "power2.inOut" }, 0.14);
      if (inC) tl.fromTo(inC, { yPercent: 9 * dir, scale: 1.03 }, { yPercent: 0, scale: 1, duration: DURATION, ease: "power3.out" }, 0.1);
    },
    [count, ids, reduced, slideEl],
  );
  const next = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

  // Wheel, touch, keyboard and #hash links drive the deck.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (dialogOpen() || insideProtected(e.target)) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // horizontal: carousels scroll natively
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      if (canScroll(scrollerFor(e.target), dir)) {
        wheelAcc.current = 0; // the slide scrolls inside itself first
        return;
      }
      if (lock.current) return;
      wheelAcc.current += e.deltaY;
      if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => (wheelAcc.current = 0), 220);
      if (Math.abs(wheelAcc.current) >= WHEEL_THRESHOLD) {
        const d: 1 | -1 = wheelAcc.current > 0 ? 1 : -1;
        wheelAcc.current = 0;
        goTo(indexRef.current + d);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      if (dialogOpen() || insideProtected(e.target)) {
        touch.current = null;
        return;
      }
      const t = e.touches[0];
      const sc = scrollerFor(e.target);
      touch.current = { x: t.clientX, y: t.clientY, upOk: canScroll(sc, -1), downOk: canScroll(sc, 1) };
    };
    const onTouchEnd = (e: TouchEvent) => {
      const s = touch.current;
      touch.current = null;
      if (!s) return;
      const t = e.changedTouches[0];
      const dy = s.y - t.clientY;
      const dx = s.x - t.clientX;
      if (Math.abs(dx) > Math.abs(dy) || Math.abs(dy) < SWIPE_THRESHOLD) return;
      const dir: 1 | -1 = dy > 0 ? 1 : -1;
      if ((dir > 0 && s.downOk) || (dir < 0 && s.upOk)) return; // it scrolled inside the slide
      goTo(indexRef.current + dir);
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable)) return;
      if (dialogOpen()) return;
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
        case " ":
          e.preventDefault();
          goTo(indexRef.current + 1);
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          goTo(indexRef.current - 1);
          break;
        case "Home":
          goTo(0);
          break;
        case "End":
          goTo(count - 1);
          break;
      }
    };
    const onHash = () => {
      const i = ids.indexOf(location.hash.replace("#", ""));
      if (i >= 0) goTo(i);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
    };
  }, [count, goTo, ids]);

  return (
    <SlidesContext.Provider value={{ index, count, ids, ready, goTo, next, prev }}>
      <main id="main" ref={stage} className="fixed inset-0 overflow-hidden bg-ink">
        {slides.map((slide, i) => (
          <section
            key={ids[i]}
            id={ids[i]}
            data-slide-index={i}
            aria-label={labels[i]}
            aria-hidden={i !== index}
            inert={i !== index}
            className={cn("absolute inset-0", i !== 0 && "invisible opacity-0")}
          >
            <div data-slide-scroll className="no-scrollbar h-full w-full overflow-y-auto overscroll-contain will-change-transform">
              {slide}
            </div>
          </section>
        ))}
      </main>

      {/* Dots: one per slide, auto-contrast over light and dark slides */}
      <nav aria-label="Sections" className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 text-white mix-blend-difference sm:flex">
        {ids.map((id, i) => (
          <button key={id} type="button" aria-label={labels[i]} aria-current={i === index ? "true" : undefined} onClick={() => goTo(i)} className="group pointer-events-auto grid h-6 w-6 place-items-center">
            <span className={cn("block rounded-full bg-current transition-all duration-300", i === index ? "h-6 w-1.5 opacity-100" : "h-1.5 w-1.5 opacity-40 group-hover:opacity-80")} />
          </button>
        ))}
      </nav>

      {children}
    </SlidesContext.Provider>
  );
}
