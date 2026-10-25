"use client";

import { ScrollTrigger, SplitText, gsap, useGSAP } from "./motion";

/**
 * The choreography between sections, in one place so the page reads as one
 * continuous film rather than a stack of blocks. Each boundary has its own
 * device, all scrubbed to scroll and all built on compositor-friendly
 * properties (transform, opacity, clip-path).
 *
 *   hero  ─ stays put, dims and recedes while the film slides over it
 *   film  ─ the last frame dims and recedes while the gallery sheet covers it
 *   map   ─ rises in as a rounded sheet
 *   agents─ cobalt wells up out of the map as an expanding circle
 *   steps ─ slanted curtain that straightens as it lands
 *   closing ─ the photograph zooms from an inset frame to full bleed
 *
 * Section headings share the hero's masked line reveal.
 */
export function useSectionTransitions(reduced: boolean) {
  useGSAP(
    () => {
      if (reduced) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = (s: string) => document.querySelector<HTMLElement>(s);
        const hero = q('[data-section="hero"]');
        const film = q('[data-section="film"]');
        const gallery = q('[data-section="gallery"]');
        const map = q('[data-section="map"]');
        const agents = q('[data-section="agents"]');
        const steps = q('[data-section="steps"]');
        const closing = q('[data-section="closing"]');

        // 1. Film covers the sticky hero.
        if (hero && film) {
          gsap
            .timeline({ scrollTrigger: { trigger: film, start: "top bottom", end: "top top", scrub: true } })
            .to("[data-hero-inner]", { scale: 0.92, yPercent: -4, ease: "none" }, 0)
            .to("[data-hero-dim]", { autoAlpha: 0.7, ease: "none" }, 0);
        }

        // 2. Gallery sheet covers the pinned film stage.
        if (film && gallery) {
          gsap
            .timeline({ scrollTrigger: { trigger: gallery, start: "top bottom", end: "top top", scrub: true } })
            .to("[data-film-inner]", { scale: 0.92, ease: "none" }, 0)
            .to("[data-film-dim]", { autoAlpha: 0.7, ease: "none" }, 0)
            .fromTo(gallery, { borderTopLeftRadius: 40, borderTopRightRadius: 40 }, { borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: "none" }, 0.75);
        }

        // 3. Map rises as a sheet.
        if (map) {
          gsap.fromTo(
            map,
            { y: 90, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
            { y: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: "none", scrollTrigger: { trigger: map, start: "top bottom", end: "top 35%", scrub: true } },
          );
        }

        // 4. Cobalt wells up out of the map.
        if (agents) {
          gsap.fromTo(
            agents,
            { clipPath: "circle(9% at 50% 100%)" },
            { clipPath: "circle(160% at 50% 100%)", ease: "none", scrollTrigger: { trigger: agents, start: "top 95%", end: "top 30%", scrub: true } },
          );
          gsap.fromTo("[data-agents-copy]", { yPercent: 12 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: agents, start: "top 92%", end: "top 20%", scrub: true } });
        }

        // 5. Steps: slanted curtain that straightens as it lands.
        if (steps) {
          gsap.fromTo(
            steps,
            { clipPath: "polygon(0 14%, 100% 0, 100% 100%, 0 100%)", y: 40 },
            { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", y: 0, ease: "none", scrollTrigger: { trigger: steps, start: "top bottom", end: "top 30%", scrub: true } },
          );
        }

        // 6. Closing: photograph zooms from an inset frame to full bleed.
        if (closing) {
          gsap.fromTo(
            "[data-closing-frame]",
            { scale: 0.84, borderRadius: 40 },
            { scale: 1, borderRadius: 0, ease: "none", scrollTrigger: { trigger: closing, start: "top bottom", end: "top 5%", scrub: true } },
          );
        }

        // Shared heading reveal, once the display font is in.
        const reveal = () => {
          const heads = gsap.utils.toArray<HTMLElement>("[data-reveal]");
          heads.forEach((el) => {
            const split = SplitText.create(el, { type: "lines", mask: "lines" });
            gsap.from(split.lines, {
              yPercent: 112,
              duration: 1.05,
              ease: "power4.out",
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: "top 86%", once: true },
            });
          });
          ScrollTrigger.refresh();
        };
        if ("fonts" in document) document.fonts.ready.then(reveal);
        else reveal();
      });
      return () => mm.revert();
    },
    { dependencies: [reduced] },
  );
}
