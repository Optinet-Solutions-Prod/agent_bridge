"use client";

import { useRef } from "react";
import { EASE, gsap, useGSAP, useMotion } from "./motion";

const STEPS = [
  { title: "An agency lists a home", body: "Price, type, size, locality, photos and the buyer-agent commission. The address and the agency stay private." },
  { title: "Buyers' agents swipe for their clients", body: "Each client brief becomes a deck of matching homes. A right swipe shortlists; competing interest is visible to the listing agent." },
  { title: "They talk as Agent #…", body: "Questions, viewings and offers happen in an anonymous chat. Nobody knows which agency is on the other side." },
  { title: "Terms are agreed, then everything is revealed", body: "A Deal Room records the commission split and the platform terms. Once both accept, names, phone numbers and the exact address unlock." },
];

/** A real sequence: the connecting line draws as you scroll and each step lights up in turn. */
export function Steps() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      if (reduced) return;
      gsap.from("[data-steps-head]", { y: 28, autoAlpha: 0, duration: 0.9, ease: EASE.out, scrollTrigger: { trigger: root.current, start: "top 75%", once: true } });
      gsap.fromTo(
        "[data-steps-line]",
        { scaleX: 0, scaleY: 1 },
        { scaleX: 1, ease: "none", scrollTrigger: { trigger: "[data-steps-list]", start: "top 70%", end: "bottom 60%", scrub: true } },
      );
      gsap.utils.toArray<HTMLElement>("[data-step]").forEach((el, i) => {
        gsap.from(el, { y: 30, autoAlpha: 0, duration: 0.8, ease: EASE.out, delay: i * 0.05, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        gsap.from(el.querySelector("[data-step-num]"), { scale: 0.6, autoAlpha: 0, duration: 0.7, ease: EASE.back, scrollTrigger: { trigger: el, start: "top 80%", once: true } });
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} aria-labelledby="steps-heading" className="bg-limestone py-20 text-ink sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="steps-heading" data-steps-head className="max-w-[20ch] font-display text-[2.2rem] leading-[1.04] tracking-tight sm:text-[3rem]">
          How a home goes from one agency&apos;s window to another agency&apos;s buyer
        </h2>
        <div className="relative mt-12 sm:mt-16">
          <div aria-hidden className="absolute left-0 right-0 top-0 hidden h-px bg-brand-700/15 lg:block">
            <div data-steps-line className="h-full w-full origin-left bg-brand-700" />
          </div>
          <ol data-steps-list className="grid gap-10 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="relative border-l border-brand-700/20 pl-5 lg:border-l-0 lg:pl-0 lg:pt-7">
                <span data-step-num className="inline-grid h-10 w-10 place-items-center rounded-full bg-brand-700 font-display text-lg text-limestone lg:absolute lg:-top-5 lg:left-0" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-3 text-[18px] font-medium leading-snug lg:mt-6">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-ink/80">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
