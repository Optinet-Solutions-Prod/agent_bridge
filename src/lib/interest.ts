import type { SupabaseClient } from "@supabase/supabase-js";

export interface ListingInterest {
  /** Other agents (not the caller) who shortlisted the listing. */
  interested: number;
  /** Their anonymous handles — returned only for listings the caller owns. */
  agents: { anon_code: string; verified: boolean }[] | null;
}

/**
 * How many other agents have shortlisted each listing. Backed by the
 * security-definer RPC in migration 0003; resolves to {} if that isn't
 * applied yet so pages keep rendering without interest badges.
 */
export async function listingInterest(supabase: SupabaseClient, ids: string[]): Promise<Record<string, ListingInterest>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (!unique.length) return {};
  const { data, error } = await supabase.rpc("listing_interest", { listing_ids: unique });
  if (error || !data) return {};
  const out: Record<string, ListingInterest> = {};
  for (const row of data as { listing_id: string; interested: number; agents: ListingInterest["agents"] }[]) {
    out[row.listing_id] = { interested: row.interested, agents: row.agents };
  }
  return out;
}

/** Flatten to { listingId: count } for client components. */
export function interestCounts(map: Record<string, ListingInterest>): Record<string, number> {
  return Object.fromEntries(Object.entries(map).map(([id, v]) => [id, v.interested]));
}
