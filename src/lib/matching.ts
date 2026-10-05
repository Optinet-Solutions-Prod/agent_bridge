import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuyerRequest, BuyerRequestWithAgent, Listing, ListingWithAgent } from "@/lib/types";

/** Quote a value for use inside a PostgREST array literal. */
function arrayLiteral(values: string[]) {
  return `{${values.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;
}

/** Live listings (from other agents) that satisfy a buyer request. */
export async function listingsMatchingRequest(
  supabase: SupabaseClient,
  req: BuyerRequest,
  opts: { excludeAgentId?: string; limit?: number } = {},
) {
  let q = supabase
    .from("listings")
    .select("*, agents(anon_code, verified)")
    .in("status", ["active", "under_offer"])
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 30);

  if (opts.excludeAgentId) q = q.neq("agent_id", opts.excludeAgentId);
  if (req.property_types.length) q = q.in("property_type", req.property_types);
  if (req.localities.length) q = q.in("locality", req.localities);
  if (req.min_price != null) q = q.gte("price", req.min_price);
  if (req.max_price != null) q = q.lte("price", req.max_price);
  if (req.min_bedrooms != null) q = q.gte("bedrooms", req.min_bedrooms);
  if (req.min_size_sqm != null) q = q.gte("size_sqm", req.min_size_sqm);
  if (req.must_have_features.length) q = q.contains("features", req.must_have_features);

  const { data } = await q;
  return (data ?? []) as ListingWithAgent[];
}

/** Active buyer requests (from other agents) that a listing would satisfy. */
export async function requestsMatchingListing(
  supabase: SupabaseClient,
  listing: Listing,
  opts: { excludeAgentId?: string; limit?: number } = {},
) {
  let q = supabase
    .from("buyer_requests")
    .select("*, agents(anon_code, verified)")
    .eq("status", "active")
    .or(`property_types.eq.{},property_types.cs.${arrayLiteral([listing.property_type])}`)
    .or(`localities.eq.{},localities.cs.${arrayLiteral([listing.locality])}`)
    .or(`max_price.is.null,max_price.gte.${listing.price}`)
    .or(`min_price.is.null,min_price.lte.${listing.price}`)
    .order("created_at", { ascending: false })
    .limit((opts.limit ?? 30) * 2);

  if (listing.bedrooms != null) q = q.or(`min_bedrooms.is.null,min_bedrooms.lte.${listing.bedrooms}`);
  else q = q.is("min_bedrooms", null);

  if (listing.size_sqm != null) q = q.or(`min_size_sqm.is.null,min_size_sqm.lte.${listing.size_sqm}`);
  else q = q.is("min_size_sqm", null);

  if (opts.excludeAgentId) q = q.neq("agent_id", opts.excludeAgentId);

  const { data } = await q;
  // Must-have features are checked here: multi-value array literals inside
  // PostgREST `or=` filters are not parsed consistently across versions.
  return ((data ?? []) as BuyerRequestWithAgent[])
    .filter((r) => r.must_have_features.every((f) => listing.features.includes(f)))
    .slice(0, opts.limit ?? 30);
}
