import Image from "next/image";
import { Bath, BedDouble, Ruler, Trees } from "lucide-react";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { formatNumber, formatPrice } from "@/lib/format";

/** A quiet beat after the dense carousel: one home, one big photograph. */
export function Featured({ home }: { home: ShowcaseHome }) {
  return (
    <section aria-labelledby="featured-heading" className="mx-auto mt-20 max-w-7xl px-4 sm:mt-28 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-end lg:gap-12">
        <div className="lg:pb-6">
          <h2 id="featured-heading" className="font-display text-[2rem] leading-[1.08] tracking-tight sm:text-[2.6rem] lg:text-[3rem]">
            {home.headline ?? home.title}
          </h2>
          <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink/75">{home.blurb}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <p className="font-display text-[2rem] leading-none tracking-tight">{formatPrice(home.price)}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-ink/80">
              {home.beds != null && (
                <li className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-ink/45" /> {home.beds} bedrooms
                </li>
              )}
              {home.baths != null && (
                <li className="inline-flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-ink/45" /> {home.baths} bathrooms
                </li>
              )}
              {home.sqm != null && (
                <li className="inline-flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-ink/45" /> {formatNumber(home.sqm, " m²")}
                </li>
              )}
              {home.plotSqm != null && (
                <li className="inline-flex items-center gap-1.5">
                  <Trees className="h-4 w-4 text-ink/45" /> {formatNumber(home.plotSqm, " m²")} plot
                </li>
              )}
            </ul>
          </div>
          <p className="mt-6 text-[15px] text-ink/75">
            {home.locality}, {home.district}. Listed by a verified agency; the exact address is shared once terms are agreed.
          </p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-sand sm:aspect-[16/11]">
          <Image src={home.photos[0]} alt={`${home.title} in ${home.locality}`} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
