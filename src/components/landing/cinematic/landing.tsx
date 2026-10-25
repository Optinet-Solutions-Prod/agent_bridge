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
import { MotionProvider } from "./motion";
import { SlideDeck, useSlides } from "./slides";
import { Steps } from "./steps";

const FILM_IDS = ["cs-guincho-architect-villa", "al-carvoeiro-villa", "cp-carvalhal-beach-house", "at-montemor-monte", "pt-foz-townhouse", "md-calheta-clifftop"];
const IDS = ["hero", "featured", "homes", "map", "agents", "steps", "closing"];
const LABELS = ["Start", "Featured homes", "Every home", "Where the stock is", "For agents", "How a deal happens", "Open the app"];
const DEMO_IDS = ["al-lagos-minimal", "lx-alfama-terrace", "st-colares-quinta", "cs-birre-villa", "pt-ribeira-apartment", "al-tavira-village-house", "at-evora-village-house"];

type Props = { homes: ShowcaseHome[]; overview: OwnerLeadOverview | null; signedIn: boolean };

export function CinematicLanding(props: Props) {
  return (
    <MotionProvider>
      <LandingInner {...props} />
    </MotionProvider>
  );
}

/**
 * One slide per beat: hero, the featured carousel, the gallery, the map,
 * the live swipe deck, the four steps and the closing frame with footer.
 */
function LandingInner({ homes, overview, signedIn }: Props) {
  const [district, setDistrict] = useState("All");
  const [open, setOpen] = useState<ShowcaseHome | null>(null);

  const byId = useMemo(() => Object.fromEntries(homes.map((h) => [h.id, h])) as Record<string, ShowcaseHome>, [homes]);
  const film = useMemo(() => FILM_IDS.map((id) => byId[id]).filter(Boolean), [byId]);
  const demo = useMemo(() => DEMO_IDS.map((id) => byId[id]).filter(Boolean), [byId]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: homes.length };
    for (const h of homes) c[h.district] = (c[h.district] ?? 0) + 1;
    return c;
  }, [homes]);
  const agencies = useMemo(() => new Set(homes.map((h) => h.agency)).size, [homes]);
  const hero = byId["al-carvoeiro-villa"] ?? homes[0];
  const closing = byId["at-montemor-monte"] ?? homes[homes.length - 1];
  const close = useCallback(() => setOpen(null), []);
  const at = (id: string) => IDS.indexOf(id);

  return (
    <SlideDeck
      ids={IDS}
      labels={LABELS}
      slides={[
        <HeroSlide key="hero" slide={0} home={hero} counts={counts} agencies={agencies} district={district} setDistrict={setDistrict} />,
        <Film key="featured" slide={at("featured")} homes={film} onOpen={setOpen} />,
        <Gallery key="homes" slide={at("homes")} homes={homes} district={district} onDistrict={setDistrict} onOpen={setOpen} />,
        <MapSlide key="map" slide={at("map")} homes={homes} overview={overview} setDistrict={setDistrict} />,
        <AgentsDemo key="agents" slide={at("agents")} homes={demo} />,
        <Steps key="steps" slide={at("steps")} />,
        <Closing key="closing" slide={at("closing")} home={closing} />,
      ]}
    >
      <CinematicHeader signedIn={signedIn} />
      {open && <HomeSheet home={open} onClose={close} />}
    </SlideDeck>
  );
}

/* Picking a district anywhere also jumps to the gallery slide. */

function HeroSlide(props: { slide: number; home: ShowcaseHome; counts: Record<string, number>; agencies: number; district: string; setDistrict: (d: string) => void }) {
  const { goTo } = useSlides();
  return (
    <Hero
      {...props}
      onPickDistrict={(d) => {
        props.setDistrict(d);
        goTo("homes");
      }}
    />
  );
}

function MapSlide(props: { slide: number; homes: ShowcaseHome[]; overview: OwnerLeadOverview | null; setDistrict: (d: string) => void }) {
  const { goTo } = useSlides();
  return (
    <MapSection
      {...props}
      onBrowse={(d) => {
        props.setDistrict(d);
        goTo("homes");
      }}
    />
  );
}
