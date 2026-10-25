"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { DISTRICTS, type ShowcaseHome } from "@/data/portugal-showcase";
import { DEMO_MODE } from "@/lib/demo";
import { unsplashBlur } from "@/lib/image-loader";
import { cn } from "@/lib/utils";
import { EASE, SplitText, gsap, useGSAP, useMotion } from "./motion";

export function Hero({
  id,
  home,
  counts,
  agencies,
  district,
  onPickDistrict,
}: {
  id: string;
  home: ShowcaseHome;
  counts: Record<string, number>;
  agencies: number;
  district: string;
  onPickDistrict: (d: string) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      if (reduced) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Slow push-in on the photograph, then a parallax drift as the hero scrolls away.
        gsap.fromTo("[data-hero-photo]", { scale: 1.14 }, { scale: 1, duration: 9, ease: "power2.out" });
        gsap.to("[data-hero-photo]", {
          yPercent: 16,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to("[data-hero-copy]", {
          yPercent: -14,
          autoAlpha: 0.35,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "70% top", scrub: true },
        });

        // Headline rises word by word out of a mask once the display font is ready.
        const run = () => {
          const split = SplitText.create("[data-hero-title]", { type: "words,lines", mask: "lines", linesClass: "line" });
          const tl = gsap.timeline({ defaults: { ease: EASE.out } });
          tl.from(split.words, { yPercent: 115, duration: 1.15, stagger: 0.045 }, 0.25)
            .from("[data-hero-sub]", { y: 26, autoAlpha: 0, duration: 1 }, 0.85)
            .from("[data-hero-cta] > *", { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 1.0)
            .from("[data-hero-bar]", { yPercent: 100, autoAlpha: 0, duration: 1, ease: "power3.out" }, 1.05)
            .from("[data-hero-cue]", { autoAlpha: 0, duration: 0.8 }, 1.4);
          gsap.to("[data-hero-cue-line]", { scaleY: 0, transformOrigin: "top", repeat: -1, yoyo: true, duration: 1.1, ease: "power2.inOut" });
        };
        if ("fonts" in document) document.fonts.ready.then(run);
        else run();
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section id={id} ref={root} data-section="hero" aria-labelledby="hero-heading" className="sticky top-0 z-0 h-[100svh] min-h-[640px] overflow-hidden bg-ink text-limestone">
      <div data-hero-inner className="relative flex h-full flex-col justify-end will-change-transform">
      <div data-hero-photo className="absolute inset-[-6%] will-change-transform">
        <Image
          src={home.photos[0]}
          alt={`${home.title} in ${home.locality}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL={unsplashBlur(home.photos[0])}
        />
      </div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/10" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/30 to-transparent" />

      <div data-hero-copy className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pb-12 lg:px-8 lg:pb-14">
        <h1
          id="hero-heading"
          data-hero-title
          className="max-w-[16ch] font-display text-[2.75rem] leading-[0.98] tracking-[-0.02em] [text-shadow:0_2px_28px_rgba(20,33,61,0.55)] sm:text-[4.2rem] lg:text-[5.2rem]"
        >
          Homes across Portugal, shared by the agents who hold them.
        </h1>
        <p data-hero-sub className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-limestone/85 sm:text-lg">
          Agencies pool their stock on AgentBridge. Browse what is on the market from Lisboa to the Algarve; when a home fits, the listing agent is
          one message away.
        </p>
        <div data-hero-cta className="mt-8 flex flex-wrap gap-3">
          <a
            href="#homes"
            className="inline-flex h-12 items-center rounded-full bg-limestone px-6 text-[15px] font-medium text-ink transition hover:bg-white active:scale-[0.98]"
          >
            Browse the homes
          </a>
          <Link
            href={DEMO_MODE ? "/discover" : "/signup"}
            className="inline-flex h-12 items-center rounded-full border border-limestone/40 px-6 text-[15px] font-medium text-limestone backdrop-blur transition hover:border-limestone/80 active:scale-[0.98]"
          >
            {DEMO_MODE ? "Try the swipe deck" : "Create an agent profile"}
          </Link>
        </div>
      </div>

      {/* Glass district bar: the working part of the hero */}
      <div data-hero-bar className="relative border-t border-limestone/15 bg-limestone/10 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div role="group" aria-label="District" className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {["All", ...DISTRICTS].map((d) => {
              const active = district === d;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onPickDistrict(d)}
                  className={cn(
                    "chip inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.97]",
                    active ? "border-limestone bg-limestone text-ink" : "border-limestone/30 text-limestone hover:border-limestone/70",
                  )}
                >
                  {d === "All" ? "All of Portugal" : d}
                  <span className={cn("text-[13px] tabular-nums", active ? "text-ink/60" : "text-limestone/60")}>{counts[d] ?? 0}</span>
                </button>
              );
            })}
          </div>
          <p className="hidden shrink-0 text-[14px] text-limestone/75 tabular-nums md:block">
            {counts.All} homes from {agencies} agencies
          </p>
        </div>
      </div>

      <div data-hero-cue aria-hidden className="pointer-events-none absolute bottom-24 right-6 hidden flex-col items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-limestone/60 lg:flex">
        <span>Scroll</span>
        <span data-hero-cue-line className="block h-12 w-px bg-limestone/60" />
      </div>
      </div>
      <div data-hero-dim aria-hidden className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
    </section>
  );
}
