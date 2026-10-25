"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Bath, BedDouble, Ruler, Trees } from "lucide-react";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { formatNumber, formatPrice } from "@/lib/format";
import { unsplashBlur } from "@/lib/image-loader";
import { cn } from "@/lib/utils";
import { gsap, useGSAP, useMotion } from "./motion";

/**
 * The pinned sequence: one home fills the screen, the next dissolves in as
 * you scroll, each with its own price counting up. With reduced motion the
 * homes simply stack.
 */
export function Film({ homes, onOpen }: { homes: ShowcaseHome[]; onOpen: (home: ShowcaseHome) => void }) {
  const root = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const { reduced } = useMotion();
  const n = homes.length;

  useGSAP(
    () => {
      if (reduced || n < 2) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const images = gsap.utils.toArray<HTMLElement>("[data-film-photo]");
        const blocks = gsap.utils.toArray<HTMLElement>("[data-film-copy]");
        const prices = gsap.utils.toArray<HTMLElement>("[data-film-price]");
        gsap.set(images.slice(1), { autoAlpha: 0, scale: 1.1 });
        gsap.set(blocks.slice(1), { autoAlpha: 0, yPercent: 30 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.7,
            pin: "[data-film-stage]",
            anticipatePin: 1,
            snap: { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.7 }, delay: 0.05, ease: "power1.inOut" },
            onUpdate: (self) => setIndex(Math.min(n - 1, Math.round(self.progress * (n - 1)))),
          },
        });

        // Each home gets one unit of scroll; the first one is already visible.
        const counters = homes.map(() => ({ v: 0 }));
        const countUp = (i: number) =>
          gsap.fromTo(
            counters[i],
            { v: homes[i].price * 0.82 },
            { v: homes[i].price, duration: 0.5, ease: "power2.out", onUpdate: () => (prices[i].textContent = formatPrice(Math.round(counters[i].v / 1000) * 1000)) },
          );
        // Idle hold at the start so the first frame can be read.
        tl.to({}, { duration: 0.35 });
        for (let i = 1; i < n; i++) {
          const at = tl.duration();
          tl.to(images[i - 1], { scale: 1.08, autoAlpha: 0, duration: 1 }, at)
            .fromTo(images[i], { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 1 }, at)
            .to(blocks[i - 1], { yPercent: -30, autoAlpha: 0, duration: 0.45 }, at)
            .fromTo(blocks[i], { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.55 }, at + 0.45)
            .add(countUp(i), at + 0.5)
            .to({}, { duration: 0.35 });
        }
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [reduced, n] },
  );

  if (reduced) {
    return (
      <section aria-label="Featured homes" className="bg-ink text-limestone">
        {homes.map((home) => (
          <article key={home.id} className="relative min-h-[80svh] overflow-hidden">
            <Image src={home.photos[0]} alt="" fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
            <div className="relative flex min-h-[80svh] items-end">
              <Copy home={home} onOpen={onOpen} />
            </div>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section ref={root} aria-label="Featured homes" className="relative bg-ink text-limestone" style={{ height: `${n * 100}vh` }}>
      <div data-film-stage className="relative h-screen overflow-hidden">
        {homes.map((home, i) => (
          <div key={home.id} data-film-photo className="absolute inset-0 will-change-transform">
            <Image
              src={home.photos[0]}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover"
              placeholder="blur"
              blurDataURL={unsplashBlur(home.photos[0])}
            />
          </div>
        ))}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/5" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/50 via-transparent to-transparent" />

        {homes.map((home, i) => (
          <div key={home.id} data-film-copy className="absolute inset-0 flex items-end" aria-hidden={i !== index}>
            <Copy home={home} onOpen={onOpen} index={i} total={n} />
          </div>
        ))}

        {/* Progress rail */}
        <ol aria-label="Progress" className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-3 sm:right-6 lg:right-10">
          {homes.map((home, i) => (
            <li key={home.id}>
              <span className={cn("block rounded-full bg-limestone transition-all duration-300", i === index ? "h-7 w-1.5 opacity-100" : "h-1.5 w-1.5 opacity-45")} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Copy({ home, onOpen, index, total }: { home: ShowcaseHome; onOpen: (h: ShowcaseHome) => void; index?: number; total?: number }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
      <div className="max-w-2xl">
        {index !== undefined && total !== undefined && (
          <p className="font-display text-[15px] text-limestone/70 tabular-nums">
            {String(index + 1).padStart(2, "0")} <span className="text-limestone/40">/ {String(total).padStart(2, "0")}</span>
          </p>
        )}
        <h2 className="mt-3 font-display text-[2.2rem] leading-[1.02] tracking-tight sm:text-[3.2rem] lg:text-[4rem]">{home.title}</h2>
        <p className="mt-3 text-[15px] text-limestone/80 sm:text-base">
          {home.type} in {home.locality}, {home.district}
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
          <p data-film-price className="font-display text-[2.4rem] leading-none tracking-tight sm:text-[3rem]">
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
          <button
            type="button"
            onClick={() => onOpen(home)}
            className="inline-flex h-11 items-center rounded-full bg-limestone px-5 text-[15px] font-medium text-ink transition hover:bg-white active:scale-[0.98]"
          >
            See this home
          </button>
          <span className="inline-flex h-11 items-center rounded-full border border-limestone/30 px-4 text-[13px] text-limestone/80">
            Listed by Agency #{home.agency}
          </span>
        </div>
      </div>
    </div>
  );
}
