import { AgentsBand } from "@/components/landing/agents-band";
import { Featured } from "@/components/landing/featured";
import { Showcase } from "@/components/landing/showcase";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Steps } from "@/components/landing/steps";
import { SHOWCASE } from "@/data/portugal-showcase";
import { getUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getUser().catch(() => null);
  const featured = SHOWCASE.find((h) => h.featured) ?? SHOWCASE[0];
  const sampleForAgents = SHOWCASE.find((h) => h.id !== featured.id && h.photos.length > 1) ?? SHOWCASE[1];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader signedIn={!!user} />

      <main id="main" className="flex-1">
        {/* Hero: the headline and, immediately, the homes themselves. */}
        <section id="homes" aria-labelledby="hero-heading" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
          <h1
            id="hero-heading"
            className="rise-in max-w-[20ch] font-display text-[2.5rem] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[3.6rem] lg:text-[4.5rem]"
          >
            Homes across Portugal, shared by the agents who hold them.
          </h1>
          <p className="rise-in mt-5 max-w-[52ch] text-[17px] leading-relaxed text-ink/75 sm:text-lg" style={{ animationDelay: "120ms" }}>
            AgentBridge is where agencies pool their stock. Browse what is on the market from Lisboa to the Algarve; when a home fits, the listing
            agent is one message away.
          </p>
          <div className="rise-in" style={{ animationDelay: "220ms" }}>
            <Showcase homes={SHOWCASE} />
          </div>
        </section>

        <Featured home={featured} />
        <AgentsBand sample={sampleForAgents} />
        <Steps />
      </main>

      <SiteFooter />
    </div>
  );
}
