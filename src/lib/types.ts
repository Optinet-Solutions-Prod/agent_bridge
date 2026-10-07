export type PlanTier = "free" | "pro" | "agency";
export type ListingStatus = "draft" | "active" | "under_offer" | "sold" | "withdrawn";
export type RequestStatus = "active" | "fulfilled" | "closed";
export type DealStatus = "proposed" | "active" | "closed" | "cancelled";

export interface Agent {
  id: string;
  anon_code: string;
  plan: PlanTier;
  verified: boolean;
  created_at: string;
}

export interface AgentIdentity {
  agent_id: string;
  full_name: string | null;
  agency_name: string | null;
  phone: string | null;
  email: string | null;
  license_no: string | null;
  updated_at: string;
}

export interface Listing {
  id: string;
  agent_id: string;
  title: string;
  property_type: string;
  status: ListingStatus;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  outdoor_sqm: number | null;
  locality: string;
  region: string | null;
  features: string[];
  description: string | null;
  photo_urls: string[];
  buyer_agent_commission_pct: number;
  created_at: string;
  updated_at: string;
}

/** Listing joined with the (anonymous) agent profile. */
export interface ListingWithAgent extends Listing {
  agents: Pick<Agent, "anon_code" | "verified"> | null;
}

export interface ListingPrivate {
  listing_id: string;
  address_line: string | null;
  block_or_building: string | null;
  street: string | null;
  lat: number | null;
  lng: number | null;
  viewing_notes: string | null;
  internal_notes: string | null;
  updated_at: string;
}

export interface BuyerRequest {
  id: string;
  agent_id: string;
  title: string;
  property_types: string[];
  localities: string[];
  min_price: number | null;
  max_price: number | null;
  min_bedrooms: number | null;
  min_size_sqm: number | null;
  must_have_features: string[];
  notes: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface BuyerRequestWithAgent extends BuyerRequest {
  agents: Pick<Agent, "anon_code" | "verified"> | null;
}

/** The subset of a buyer request that drives matching; also used for ad-hoc swipe briefs. */
export type MatchCriteria = Pick<
  BuyerRequest,
  "property_types" | "localities" | "min_price" | "max_price" | "min_bedrooms" | "min_size_sqm" | "must_have_features"
>;

export type SwipeDecision = "like" | "pass";

export interface ListingSwipe {
  id: string;
  agent_id: string;
  buyer_request_id: string | null;
  listing_id: string;
  decision: SwipeDecision;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_agent_id: string;
  listing_agent_id: string;
  buyer_request_id: string | null;
  created_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface DealRoom {
  id: string;
  conversation_id: string;
  listing_id: string;
  listing_agent_id: string;
  buyer_agent_id: string;
  proposed_by: string;
  buyer_agent_commission_pct: number;
  platform_fee_pct: number;
  terms_version: string;
  buyer_brief: string | null;
  status: DealStatus;
  listing_agent_accepted_at: string | null;
  buyer_agent_accepted_at: string | null;
  revealed_at: string | null;
  sale_price: number | null;
  closed_at: string | null;
  created_at: string;
}

/** Standard shape returned by form server actions used with useActionState. */
export interface ActionState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}
