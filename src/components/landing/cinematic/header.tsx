"use client";

import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { APP_NAME } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { useSlides } from "./slides";

/** The wordmark as a button: takes the deck back to the first slide. */
export function BrandButton({ light }: { light?: boolean }) {
  const { goTo } = useSlides();
  return (
    <button type="button" onClick={() => goTo(0)} aria-label={`${APP_NAME}, back to the start`} className="inline-flex items-center gap-2.5 rounded-lg">
      <LogoMark />
      <span className={cn("font-display text-[1.25rem] leading-none tracking-tight", light ? "text-white" : "text-ink")}>{APP_NAME}</span>
    </button>
  );
}

/** Transparent with light text over photographic and cobalt slides, solid limestone over light ones; a thin line shows deck progress. */
export function CinematicHeader({ signedIn }: { signedIn: boolean }) {
  const { index, count, ids, goTo } = useSlides();
  const id = ids[index] ?? "hero";
  const solid = !(id === "hero" || id === "agents" || id === "closing" || id === "featured");
  const link = cn("rounded-lg px-3 py-2 text-[15px] transition-colors", solid ? "text-ink/75 hover:text-ink" : "text-limestone/80 hover:text-limestone");

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        solid ? "bg-limestone/85 shadow-[0_1px_0_rgba(20,33,61,0.06)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-[2px] origin-left transition-transform duration-700 ease-out", solid ? "bg-brand-700" : "bg-limestone/80")}
        style={{ transform: `scaleX(${count > 1 ? index / (count - 1) : 0})` }}
      />
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <BrandButton light={!solid} />
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={() => goTo("homes")} className={cn("hidden sm:inline", link)}>
            Homes
          </button>
          <button type="button" onClick={() => goTo("map")} className={cn("hidden sm:inline", link)}>
            Portugal
          </button>
          <button type="button" onClick={() => goTo("agents")} className={cn("hidden sm:inline", link)}>
            For agents
          </button>
          {!signedIn && (
            <Link href="/login" className={cn("hidden sm:inline", link)}>
              Log in
            </Link>
          )}
          <Link
            href={signedIn ? "/dashboard" : DEMO_MODE ? "/dashboard" : "/signup"}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition active:scale-[0.98] sm:h-10 sm:px-5",
              solid ? "bg-brand-700 text-white hover:bg-brand-800" : "bg-limestone text-ink hover:bg-white",
            )}
          >
            {signedIn ? "Open dashboard" : DEMO_MODE ? "Open the app" : "Join the network"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
