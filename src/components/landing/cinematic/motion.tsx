"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, useGSAP);

export { gsap, SplitText, useGSAP };

/** Strong eases shared by every landing animation (see DESIGN.md). */
export const EASE = {
  out: "power4.out",
  inOut: "power3.inOut",
  back: "back.out(1.6)",
} as const;

type MotionContextValue = {
  /** True when the visitor asked for reduced motion: slides switch instantly, intros are skipped. */
  reduced: boolean;
};

const MotionContext = createContext<MotionContextValue>({ reduced: false });
export const useMotion = () => useContext(MotionContext);

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const readReduced = () => window.matchMedia(REDUCED_QUERY).matches;
const readReducedServer = () => false;

export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, readReducedServer);
  const value = useMemo<MotionContextValue>(() => ({ reduced }), [reduced]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

/** Masked line-by-line reveal for a heading; call inside a GSAP context. */
export function revealLines(el: Element | null, at = 0, tl?: gsap.core.Timeline) {
  if (!el) return;
  const split = SplitText.create(el, { type: "lines", mask: "lines" });
  const vars = { yPercent: 112, duration: 1.05, ease: EASE.out, stagger: 0.09 };
  if (tl) tl.from(split.lines, vars, at);
  else gsap.from(split.lines, { ...vars, delay: at });
}
