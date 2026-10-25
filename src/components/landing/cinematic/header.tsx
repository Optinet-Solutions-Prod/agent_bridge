"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { DEMO_MODE } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { ScrollTrigger, useGSAP } from "./motion";

/** Transparent over the hero, solid limestone once the hero has scrolled away. */
export function CinematicHeader({ signedIn, heroId }: { signedIn: boolean; heroId: string }) {
  const [solid, setSolid] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Active from the moment the hero has scrolled past the bar until the end of
    // the page, so a jump straight to a lower section still gets a solid header.
    const trigger = ScrollTrigger.create({
      trigger: `#${heroId}`,
      start: "bottom 72px",
      end: "max",
      onToggle: (self) => setSolid(self.isActive),
      onRefresh: (self) => setSolid(self.isActive),
    });
    return () => trigger.kill();
  }, [heroId]);

  const link = cn("rounded-lg px-3 py-2 text-[15px] transition", solid ? "text-ink/75 hover:text-ink" : "text-limestone/80 hover:text-limestone");

  return (
    <header
      ref={ref}
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        solid ? "bg-limestone/85 shadow-[0_1px_0_rgba(20,33,61,0.06)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Logo light={!solid} />
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
          <a href="#homes" className={cn("hidden sm:inline", link)}>
            Homes
          </a>
          <a href="#map" className={cn("hidden sm:inline", link)}>
            Portugal
          </a>
          <a href="#agents" className={cn("hidden sm:inline", link)}>
            For agents
          </a>
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
