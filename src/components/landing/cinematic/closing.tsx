"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { APP_NAME } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demo";
import { unsplashBlur } from "@/lib/image-loader";
import { BrandButton } from "./header";
import { EASE, gsap, revealLines } from "./motion";
import { useSlideIntro, useSlides } from "./slides";

/** The last beat: one more photograph, one clear action, and the footer. */
export function Closing({ slide, home }: { slide: number; home: ShowcaseHome }) {
  const root = useRef<HTMLDivElement>(null);
  const { goTo } = useSlides();

  useSlideIntro(slide, root, () => {
    gsap.fromTo("[data-closing-photo]", { scale: 1.08 }, { scale: 1, duration: 8, ease: "power1.out" });
    const tl = gsap.timeline({ delay: 0.2, defaults: { ease: EASE.out } });
    revealLines(root.current?.querySelector("h2") ?? null, 0, tl);
    tl.from("[data-closing-copy] > :not(h2)", { y: 30, autoAlpha: 0, duration: 1, stagger: 0.1 }, 0.3);
    tl.from("[data-closing-footer]", { autoAlpha: 0, duration: 0.8 }, 0.9);
  });

  return (
    <div ref={root} className="relative flex min-h-full flex-col overflow-hidden bg-ink text-limestone">
      <div data-closing-photo className="absolute inset-0 will-change-transform">
        <Image src={home.photos[0]} alt="" fill sizes="100vw" className="object-cover" placeholder="blur" blurDataURL={unsplashBlur(home.photos[0])} />
      </div>
      <div aria-hidden className="absolute inset-0 bg-ink/55" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/20" />

      <div data-closing-copy className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 pt-24 text-center sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-[18ch] font-display text-[min(2.4rem,6vh)] leading-[1.02] tracking-tight sm:text-[min(3.4rem,7.5vh)] lg:text-[min(4.4rem,9vh)]">
          See the network the way an agent does.
        </h2>
        <p className="mx-auto mt-5 max-w-[48ch] text-[clamp(15px,2.1vh,17px)] leading-relaxed text-limestone/85">
          Open the app, set a client&apos;s brief and swipe through every agency&apos;s stock. No account needed to look around.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex h-12 items-center rounded-full bg-limestone px-7 text-[15px] font-medium text-ink transition hover:bg-white active:scale-[0.98]">
            {DEMO_MODE ? "Open the app" : "Open dashboard"}
          </Link>
          <Link href="/signup" className="inline-flex h-12 items-center rounded-full border border-limestone/40 px-7 text-[15px] font-medium text-limestone backdrop-blur transition hover:border-limestone/80 active:scale-[0.98]">
            Create an agent profile
          </Link>
        </div>
      </div>

      <footer data-closing-footer className="relative border-t border-limestone/15">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 text-[13px] text-limestone/75 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandButton light />
            <span className="hidden sm:inline">The private property network for Portugal.</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
            <button type="button" onClick={() => goTo("homes")} className="hover:text-limestone">
              Homes
            </button>
            <button type="button" onClick={() => goTo("map")} className="hover:text-limestone">
              Portugal
            </button>
            <button type="button" onClick={() => goTo("agents")} className="hover:text-limestone">
              For agents
            </button>
            <Link href="/login" className="hover:text-limestone">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-limestone">
              Create an agent profile
            </Link>
          </nav>
          <span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>
        </div>
      </footer>
    </div>
  );
}
