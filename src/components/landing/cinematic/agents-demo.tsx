"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { SwipeDeck } from "@/components/swipe-deck";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { DEMO_MODE } from "@/lib/demo";
import { showcaseToListing } from "@/lib/showcase-to-listing";
import { EASE, gsap, useGSAP, useMotion } from "./motion";

/** The committed colour and the real product: a live deck visitors can swipe. */
export function AgentsDemo({
  id,
  homes,
}: {
  id: string;
  homes: ShowcaseHome[];
}) {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotion();
  const listings = useMemo(() => homes.map(showcaseToListing), [homes]);
  // Two of the demo homes already have competing interest, so a right swipe celebrates.
  const interest = useMemo(
    () =>
      Object.fromEntries(
        homes.map((h, i) => [h.id, i === 1 ? 2 : i === 3 ? 3 : 0]),
      ),
    [homes],
  );

  useGSAP(
    () => {
      if (reduced) return;
      gsap.from("[data-agents-copy] > :not(h2)", {
        y: 30,
        autoAlpha: 0,
        duration: 1,
        ease: EASE.out,
        stagger: 0.09,
        scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
      });
      gsap.from("[data-agents-deck]", {
        y: 60,
        autoAlpha: 0,
        rotation: 3,
        duration: 1.2,
        ease: EASE.out,
        scrollTrigger: { trigger: root.current, start: "top 60%", once: true },
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <div className="relative z-30 -mt-[26vh] bg-sand">
      <section
        id={id}
        ref={root}
        data-section="agents"
        aria-labelledby="agents-heading"
        className="relative overflow-hidden bg-brand-800 text-limestone [clip-path:circle(160%_at_50%_100%)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-brand-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-brand-950/60 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-40 pt-[22vh] sm:px-6 sm:pb-44 sm:pt-[26vh] lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-48 lg:pt-[30vh]">
          <div data-agents-copy>
            <h2
              id="agents-heading"
              data-reveal
              className="font-display text-[2.2rem] leading-[1.04] tracking-tight sm:text-[3rem] lg:text-[3.6rem]"
            >
              Agents: swipe through every agency&apos;s stock for your client.
              Try it, right here.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-limestone/85">
              Drag a card. Right means{" "}
              <strong className="font-medium text-limestone">
                Interested!
              </strong>
              , left means not. When another agent already wants the same home,
              you&apos;ll see it.
            </p>
            <div className="mt-8 max-w-[52ch] space-y-4 text-[16px] leading-relaxed text-limestone/80">
              <p>
                <strong className="font-medium text-limestone">
                  List once, anonymously.
                </strong>{" "}
                Price, type, size, locality, photos and the commission you
                offer. The street, the owner and your name stay private; that is
                enforced in the database, not just hidden on screen.
              </p>
              <p>
                <strong className="font-medium text-limestone">
                  Terms before names.
                </strong>{" "}
                Chat as Agent #…, then open a Deal Room. Both sides accept the
                split and the platform terms digitally, and only then are names,
                contacts and the address revealed.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={DEMO_MODE ? "/discover" : "/signup"}
                className="inline-flex h-12 items-center rounded-full bg-limestone px-6 text-[15px] font-medium text-brand-900 transition hover:bg-white active:scale-[0.98]"
              >
                {DEMO_MODE ? "Open the real deck" : "Create your agent profile"}
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-12 items-center rounded-full border border-limestone/30 px-6 text-[15px] font-medium text-limestone transition hover:border-limestone/60 active:scale-[0.98]"
              >
                Create an agent profile
              </Link>
            </div>
          </div>

          <div
            data-agents-deck
            className="flex h-[640px] flex-col lg:block lg:h-auto [&_[data-deck-hint]]:text-limestone/70 [&_[data-deck-hint]_a]:text-limestone [&_[data-control-label]]:text-limestone/80"
          >
            <SwipeDeck
              demo
              listings={listings}
              requestId={null}
              likedCount={0}
              shortlistHref="/dashboard"
              interest={interest}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
