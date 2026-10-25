"use client";

import Image from "next/image";
import { useRef } from "react";
import { Bath, BedDouble, Ruler, Trees } from "lucide-react";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { formatNumber, formatPrice } from "@/lib/format";
import { unsplashBlur } from "@/lib/image-loader";
import { EASE, gsap } from "./motion";
import { useSlideIntro } from "./slides";

/** One home, full screen: a slow push-in on the photograph, the copy rising in, the price counting up. */
export function FilmSlide({ home, slide, number, total, onOpen }: { home: ShowcaseHome; slide: number; number: number; total: number; onOpen: (home: ShowcaseHome) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const price = useRef<HTMLParagraphElement>(null);

  useSlideIntro(slide, root, () => {
    gsap.fromTo("[data-film-photo]", { scale: 1.1 }, { scale: 1, duration: 8, ease: "power1.out" });
    const tl = gsap.timeline({ defaults: { ease: EASE.out }, delay: 0.25 });
    tl.from("[data-film-copy] > *", { y: 28, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0);
    const counter = { v: home.price * 0.8 };
    tl.to(counter, { v: home.price, duration: 1.1, ease: "power2.out", onUpdate: () => { if (price.current) price.current.textContent = formatPrice(Math.round(counter.v / 1000) * 1000); } }, 0.3);
  });

  return (
    <div ref={root} className="relative flex min-h-full items-end overflow-hidden bg-ink text-limestone">
      <div data-film-photo className="absolute inset-0 will-change-transform">
        <Image src={home.photos[0]} alt="" fill sizes="100vw" className="object-cover" placeholder="blur" blurDataURL={unsplashBlur(home.photos[0])} />
      </div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/5" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/50 via-transparent to-transparent" />

      <div data-film-copy className="relative mx-auto w-full max-w-7xl px-4 pb-[min(4rem,7vh)] pt-24 sm:px-6 lg:px-8">
        <p className="font-display text-[15px] text-limestone/70 tabular-nums">
          {String(number).padStart(2, "0")} <span className="text-limestone/40">/ {String(total).padStart(2, "0")}</span>
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-[min(2.2rem,5.6vh)] leading-[1.02] tracking-tight sm:text-[min(3.2rem,7vh)] lg:text-[min(4rem,8vh)]">{home.title}</h2>
        <p className="mt-3 text-[15px] text-limestone/80 sm:text-base">
          {home.type} in {home.locality}, {home.district}
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
          <p ref={price} className="font-display text-[min(2.4rem,5.5vh)] leading-none tracking-tight sm:text-[min(3rem,6.5vh)]">
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
  );
}
