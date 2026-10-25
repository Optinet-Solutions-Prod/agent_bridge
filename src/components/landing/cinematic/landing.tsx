"use client";

import { useCallback, useMemo, useState } from "react";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import type { OwnerLeadOverview } from "@/lib/types";
import { AgentsDemo } from "./agents-demo";
import { CinematicHeader } from "./header";
import { Closing } from "./closing";
import { Film } from "./film";
import { Gallery } from "./gallery";
import { Hero } from "./hero";
import { HomeSheet } from "./home-sheet";
import { MapSection } from "./map-section";
import { MotionProvider, useMotion } from "./motion";
import { Steps } from "./steps";

const FILM_IDS = ["cs-guincho-architect-villa", "al-carvoeiro-villa", "cp-carvalhal-beach-house", "at-montemor-monte", "pt-foz-townhouse", "md-calheta-clifftop"];
const DEMO_IDS = ["al-lagos-minimal", "lx-alfama-terrace", "st-colares-quinta", "cs-birre-villa", "pt-ribeira-apartment", "al-tavira-village-house", "at-evora-village-house"];

export function CinematicLanding(props: { homes: ShowcaseHome[]; overview: OwnerLeadOverview | null; signedIn: boolean }) {
  return (
    <MotionProvider>
      <LandingInner {...props} />
    </MotionProvider>
  );
}

function LandingInner({ homes, overview, signedIn }: { homes: ShowcaseHome[]; overview: OwnerLeadOverview | null; signedIn: boolean }) {
  const [district, setDistrict] = useState("All");
  const [open, setOpen] = useState<ShowcaseHome | null>(null);
  const { scrollTo } = useMotion();

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: homes.length };
    for (const h of homes) c[h.district] = (c[h.district] ?? 0) + 1;
    return c;
  }, [homes]);
  const agencies = useMemo(() => new Set(homes.map((h) => h.agency)).size, [homes]);
  const byId = useMemo(() => Object.fromEntries(homes.map((h) => [h.id, h])), [homes]);
  const film = FILM_IDS.map((id) => byId[id]).filter(Boolean);
  const demo = DEMO_IDS.map((id) => byId[id]).filter(Boolean);
  const hero = byId["al-carvoeiro-villa"] ?? homes[0];
  const closing = byId["at-montemor-monte"] ?? homes[homes.length - 1];

  const browse = useCallback(
    (d: string) => {
      setDistrict(d);
      scrollTo("#homes", -72);
    },
    [scrollTo],
  );
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <CinematicHeader signedIn={signedIn} heroId="hero" />
      <main id="main">
        <Hero id="hero" home={hero} counts={counts} agencies={agencies} district={district} onPickDistrict={browse} />
        <Film homes={film} onOpen={setOpen} />
        <Gallery id="homes" homes={homes} district={district} onDistrict={setDistrict} onOpen={setOpen} />
        <MapSection id="map" homes={homes} overview={overview} onBrowse={browse} />
        <AgentsDemo id="agents" homes={demo} />
        <Steps />
        <Closing home={closing} />
      </main>
      {open && <HomeSheet home={open} onClose={close} />}
    </>
  );
}
