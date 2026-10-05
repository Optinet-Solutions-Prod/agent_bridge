import type { DealStatus, ListingStatus, PlanTier } from "@/lib/types";

export const APP_NAME = "AgentBridge";
export const APP_TAGLINE = "The private MLS for real-estate agents.";

/** Share of the buyer-side commission the platform takes on a closed deal. */
export const PLATFORM_FEE_PCT = 7.5;

export const PROPERTY_TYPES = [
  "Apartment",
  "Penthouse",
  "Maisonette",
  "Townhouse",
  "Terraced House",
  "Villa",
  "Bungalow",
  "Farmhouse",
  "House of Character",
  "Palazzo",
  "Plot",
  "Office",
  "Retail",
  "Garage",
  "Development Site",
] as const;

export const FEATURES = [
  "Sea view",
  "Country view",
  "Pool",
  "Garden",
  "Terrace",
  "Garage",
  "Parking",
  "Lift",
  "Airspace",
  "Furnished",
  "Highly finished",
  "Shell form",
  "New build",
  "Pet friendly",
  "Home office",
] as const;

/** Malta localities grouped by region. Launch market is Malta; extend as you expand. */
export const REGIONS: Record<string, string[]> = {
  "Northern Harbour": [
    "Sliema",
    "St Julian's",
    "Gżira",
    "Msida",
    "Swieqi",
    "Pembroke",
    "Ta' Xbiex",
    "San Ġwann",
    "Kappara",
    "Madliena",
    "Birkirkara",
    "Ħamrun",
    "Santa Venera",
    "Pietà",
  ],
  "Southern Harbour": ["Valletta", "Floriana", "Marsa", "Paola", "Tarxien", "Cospicua", "Senglea", "Vittoriosa", "Kalkara", "Żabbar"],
  Northern: ["St Paul's Bay", "Qawra", "Buġibba", "Xemxija", "Mellieħa", "Mġarr", "Mosta", "Naxxar", "Għargħur", "Burmarrad"],
  Western: ["Attard", "Balzan", "Lija", "Iklin", "Rabat", "Mdina", "Dingli", "Żebbuġ", "Siġġiewi", "Mtarfa"],
  "South Eastern": ["Marsaskala", "Marsaxlokk", "Birżebbuġa", "Żejtun", "Għaxaq", "Gudja", "Qormi", "Luqa", "Żurrieq", "Mqabba", "Safi", "Kirkop"],
  Gozo: ["Victoria", "Xagħra", "Nadur", "Marsalforn", "Xlendi", "Għarb", "Sannat", "Munxar", "Qala", "Għajnsielem", "Kerċem", "Żebbuġ Gozo"],
};

export const LOCALITIES = Object.values(REGIONS).flat();

export function regionOf(locality: string): string | null {
  for (const [region, towns] of Object.entries(REGIONS)) {
    if (towns.includes(locality)) return region;
  }
  return null;
}

export const PLANS: Record<
  PlanTier,
  { name: string; priceMonthly: number; listingLimit: number | null; blurb: string; perks: string[] }
> = {
  free: {
    name: "Free",
    priceMonthly: 0,
    listingLimit: 3,
    blurb: "Try the network.",
    perks: ["Browse live inventory", "Up to 3 live listings", "Anonymous chat", "Deal Rooms"],
  },
  pro: {
    name: "Pro Agent",
    priceMonthly: 79,
    listingLimit: null,
    blurb: "For agents who close.",
    perks: ["Unlimited listings", "Unlimited buyer requests", "Match alerts", "Saved buyers", "Priority support"],
  },
  agency: {
    name: "Agency",
    priceMonthly: 299,
    listingLimit: null,
    blurb: "Your whole team on the network.",
    perks: ["Everything in Pro", "Up to 10 agent seats", "Agency analytics", "Promoted inventory", "Dedicated onboarding"],
  },
};

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  draft: "Draft",
  active: "Live",
  under_offer: "Under offer",
  sold: "Sold",
  withdrawn: "Withdrawn",
};

export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  proposed: "Awaiting acceptance",
  active: "Terms agreed",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const CO_BROKER_TERMS_VERSION = "v1";

export const CO_BROKER_TERMS = [
  "The Listing Agent confirms they hold a valid mandate to market the property described in this Deal Room.",
  "The Buyer Agent confirms they represent a genuine, identifiable buyer for whom this property is being introduced.",
  "If this property is purchased by the Buyer Agent's client (or any party introduced through them), the Listing Agent will pay the Buyer Agent the buyer-agent commission stated in this Deal Room, calculated on the final sale price.",
  `The AgentBridge platform fee of ${PLATFORM_FEE_PCT}% of the buyer-agent commission is payable by each participating side on completion, regardless of whether subsequent communication, viewings or negotiations take place outside AgentBridge.`,
  "Both agents agree that this introduction was made through AgentBridge and will not circumvent, directly or indirectly, the terms above for a period of 12 months from the date of agreement.",
  "Identities, contact details and the exact location of the property are revealed only once both parties have accepted these terms.",
];
