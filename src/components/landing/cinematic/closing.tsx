"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { DEMO_MODE } from "@/lib/demo";
import { unsplashBlur } from "@/lib/image-loader";
import { EASE, gsap, useGSAP, useMotion } from "./motion";

/** The last beat: one more photograph, one clear action. */
export function Closing({ home }: { home: ShowcaseHome }) {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      if (reduced) return;
      gsap.fromTo("[data-closing-photo]", { yPercent: -12 }, { yPercent: 12, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from("[data-closing-copy] > :not(h2)", { y: 30, autoAlpha: 0, duration: 1, ease: EASE.out, stagger: 0.1, scrollTrigger: { trigger: root.current, start: "top 65%", once: true } });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} data-section="closing" aria-labelledby="closing-heading" className="relative isolate flex min-h-[90svh] items-center overflow-hidden bg-limestone text-limestone">
      <div data-closing-frame className="absolute inset-0 overflow-hidden bg-ink will-change-transform" style={{ borderRadius: 40 }}>
        <div data-closing-photo className="absolute inset-[-14%_0] will-change-transform">
          <Image src={home.photos[0]} alt="" fill sizes="100vw" className="object-cover" placeholder="blur" blurDataURL={unsplashBlur(home.photos[0])} />
        </div>
        <div aria-hidden className="absolute inset-0 bg-ink/55" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
      </div>
      <div data-closing-copy className="relative mx-auto w-full max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h2 id="closing-heading" data-reveal className="mx-auto max-w-[18ch] font-display text-[2.4rem] leading-[1.02] tracking-tight sm:text-[3.4rem] lg:text-[4.4rem]">
          See the network the way an agent does.
        </h2>
        <p className="mx-auto mt-5 max-w-[48ch] text-[17px] leading-relaxed text-limestone/85">
          Open the app, set a client&apos;s brief and swipe through every agency&apos;s stock. No account needed to look around.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex h-12 items-center rounded-full bg-limestone px-7 text-[15px] font-medium text-ink transition hover:bg-white active:scale-[0.98]">
            {DEMO_MODE ? "Open the app" : "Open dashboard"}
          </Link>
          <Link href="/signup" className="inline-flex h-12 items-center rounded-full border border-limestone/40 px-7 text-[15px] font-medium text-limestone backdrop-blur transition hover:border-limestone/80 active:scale-[0.98]">
            Create an agent profile
          </Link>
        </div>
      </div>
    </section>
  );
}
