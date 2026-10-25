"use client";

import { useRef } from "react";
import { EASE, gsap, revealLines } from "./motion";
import { useSlideIntro } from "./slides";

const STEPS = [
  { title: "An agency lists a home", body: "Price, type, size, locality, photos and the buyer-agent commission. The address and the agency stay private." },
  { title: "Buyers' agents swipe for their clients", body: "Each client brief becomes a deck of matching homes. A right swipe shortlists; competing interest is visible to the listing agent." },
  { title: "They talk as Agent #…", body: "Questions, viewings and offers happen in an anonymous chat. Nobody knows which agency is on the other side." },
  { title: "Terms are agreed, then everything is revealed", body: "A Deal Room records the commission split and the platform terms. Once both accept, names, phone numbers and the exact address unlock." },
];

/** A real sequence: the connecting line draws and each step lights up in turn. */
export function Steps({ slide }: { slide: number }) {
  const root = useRef<HTMLDivElement>(null);

  useSlideIntro(slide, root, () => {
    const tl = gsap.timeline({ delay: 0.2, defaults: { ease: EASE.out } });
    revealLines(root.current?.querySelector("h2") ?? null, 0, tl);
    tl.fromTo("[data-steps-line]", { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: "power2.inOut" }, 0.4)
      .from("[data-step]", { y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.14 }, 0.5)
      .from("[data-step-num]", { scale: 0.6, autoAlpha: 0, duration: 0.7, ease: EASE.back, stagger: 0.14 }, 0.55);
  });

  return (
    <div ref={root} className="flex min-h-full flex-col justify-center bg-limestone px-4 pb-10 pt-20 text-ink sm:px-6 sm:pt-24 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <h2 className="max-w-[20ch] font-display text-[min(2.1rem,5vh)] leading-[1.04] tracking-tight sm:text-[min(2.8rem,6vh)] lg:text-[min(3.2rem,6.5vh)]">
          How a home goes from one agency&apos;s window to another agency&apos;s buyer
        </h2>
        <div className="relative mt-8 sm:mt-12">
          <div aria-hidden className="absolute left-0 right-0 top-0 hidden h-px bg-brand-700/15 lg:block">
            <div data-steps-line className="h-full w-full origin-left bg-brand-700" />
          </div>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="relative border-l border-brand-700/20 pl-5 lg:border-l-0 lg:pl-0 lg:pt-7">
                <span data-step-num className="inline-grid h-10 w-10 place-items-center rounded-full bg-brand-700 font-display text-lg text-limestone lg:absolute lg:-top-5 lg:left-0" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-3 text-[17px] font-medium leading-snug lg:mt-6">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 max-w-[38ch] text-[clamp(14px,1.9vh,15px)] leading-relaxed text-ink/80">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
