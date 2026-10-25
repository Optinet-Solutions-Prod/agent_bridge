"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export { gsap, ScrollTrigger, SplitText, useGSAP };

/** Strong eases shared by every landing animation (see DESIGN.md). */
export const EASE = {
  out: "power4.out",
  inOut: "power3.inOut",
  back: "back.out(1.6)",
} as const;

type MotionContextValue = {
  /** True when the visitor asked for reduced motion: no smooth scroll, no pinning, no parallax. */
  reduced: boolean;
  /** Scroll to an element (smoothly through Lenis when it is running). */
  scrollTo: (target: HTMLElement | string, offset?: number) => void;
};

const MotionContext = createContext<MotionContextValue>({ reduced: false, scrollTo: () => {} });
export const useMotion = () => useContext(MotionContext);

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const readReduced = () => window.matchMedia(REDUCED_QUERY).matches;
const readReducedServer = () => false;

/**
 * Runs Lenis smooth scrolling in step with GSAP's ticker and keeps
 * ScrollTrigger informed. Lenis leaves touch scrolling native, so phones keep
 * their own physics; wheel and keyboard get the eased scroll.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, readReducedServer);
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reduced) return;
    const instance = new Lenis({ lerp: 0.11, smoothWheel: true, anchors: true });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("lenis-on");
    lenis.current = instance;
    // Exposed for browser automation (scroll-position screenshots) and debugging.
    (window as Window & { __lenis?: Lenis }).__lenis = instance;
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tick);
      instance.destroy();
      document.documentElement.classList.remove("lenis-on");
      lenis.current = null;
    };
  }, [reduced]);

  const scrollTo = useCallback(
    (target: HTMLElement | string, offset = 0) => {
      if (lenis.current) lenis.current.scrollTo(target, { offset, duration: 1.1 });
      else {
        const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
        el?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    },
    [reduced],
  );

  const value = useMemo<MotionContextValue>(() => ({ reduced, scrollTo }), [reduced, scrollTo]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
