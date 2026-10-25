import type { DealStatus, LeadStatus, ListingStatus, PlanTier } from "@/lib/types";

export const APP_NAME = "AgentBridge";
export const APP_TAGLINE = "The private property network for Portugal.";

/** Share of the buyer-side commission the platform takes on a closed deal. */
export const PLATFORM_FEE_PCT = 7.5;

export const PROPERTY_TYPES = [
  "Apartment",
  "Penthouse",
  "Duplex",
  "Townhouse",
  "House",
  "Villa",
  "Quinta",
  "Farmhouse",
  "Plot",
  "Office",
  "Retail",
  "Garage",
  "Development site",
  "Building",
] as const;

export const FEATURES = [
  "Sea view",
  "River view",
  "Country view",
  "Pool",
  "Garden",
  "Terrace",
  "Balcony",
  "Garage",
  "Parking",
  "Lift",
  "Furnished",
  "New build",
  "Renovated",
  "Needs work",
  "Air conditioning",
  "Beach access",
  "Golf",
  "Guest house",
  "Short-let licence",
  "Courtyard",
  "Roof terrace",
] as const;

/**
 * Portuguese localities grouped by the regions the landing page uses. A
 * listing stores one locality; its region is derived with regionOf().
 */
export const REGIONS: Record<string, string[]> = {
  Lisboa: [
    "Alfama",
    "Graça",
    "Príncipe Real",
    "Bairro Alto",
    "Chiado",
    "Lapa",
    "Estrela",
    "Campo de Ourique",
    "Avenidas Novas",
    "Parque das Nações",
    "Belém",
    "Restelo",
    "Alvalade",
    "Oeiras",
    "Carcavelos",
    "Almada",
  ],
  Cascais: ["Cascais", "Estoril", "Monte Estoril", "Birre", "Guincho", "Quinta da Marinha", "Parede", "Alcabideche"],
  Sintra: ["Sintra", "Colares", "Praia das Maçãs", "Azenhas do Mar", "Malveira da Serra", "Queluz"],
  Comporta: ["Comporta", "Carvalhal", "Melides", "Grândola", "Tróia", "Brejos da Carregueira"],
  Alentejo: ["Évora", "Montemor-o-Novo", "Estremoz", "Monsaraz", "Arraiolos", "Beja", "Vila Nova de Milfontes", "Zambujeira do Mar"],
  Porto: ["Porto", "Ribeira", "Foz do Douro", "Boavista", "Cedofeita", "Matosinhos", "Vila Nova de Gaia", "Leça da Palmeira"],
  Algarve: ["Lagos", "Praia da Luz", "Carvoeiro", "Quinta do Lago", "Vale do Lobo", "Vilamoura", "Albufeira", "Tavira", "Faro", "Loulé", "Portimão", "Sagres", "Aljezur"],
  Madeira: ["Funchal", "Calheta", "Ponta do Sol", "Câmara de Lobos", "Caniço", "Santa Cruz", "Porto Moniz"],
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

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  appointment: "Appointment",
  listed: "Listed with us",
  not_interested: "Not interested",
};

export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "appointment", "listed", "not_interested"];

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
