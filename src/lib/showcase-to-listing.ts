import type { ShowcaseHome } from "@/data/portugal-showcase";
import type { ListingWithAgent } from "@/lib/types";

/** Lets the real swipe deck run on the landing page with showcase homes. */
export function showcaseToListing(home: ShowcaseHome): ListingWithAgent {
  return {
    id: home.id,
    agent_id: `demo-${home.agency}`,
    title: home.title,
    property_type: home.type,
    status: "active",
    price: home.price,
    currency: "EUR",
    bedrooms: home.beds,
    bathrooms: home.baths,
    size_sqm: home.sqm,
    outdoor_sqm: home.plotSqm ?? null,
    locality: home.locality,
    region: home.district,
    features: home.features,
    description: home.blurb,
    photo_urls: home.photos,
    buyer_agent_commission_pct: home.commissionPct,
    created_at: "",
    updated_at: "",
    agents: { anon_code: home.agency, verified: true },
  };
}
