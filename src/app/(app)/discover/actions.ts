"use server";

import { revalidatePath } from "next/cache";
import { requireAgent } from "@/lib/auth";
import type { SwipeDecision } from "@/lib/types";

/** Called from the deck on every swipe; the UI is optimistic so this returns quickly. */
export async function recordSwipe(listingId: string, requestId: string | null, decision: SwipeDecision) {
  const { supabase, agent } = await requireAgent();
  const { error } = await supabase
    .from("listing_swipes")
    .upsert(
      { agent_id: agent.id, buyer_request_id: requestId, listing_id: listingId, decision },
      { onConflict: "agent_id,buyer_request_id,listing_id" },
    );
  return error ? { error: error.message } : { ok: true as const };
}

export async function undoSwipe(listingId: string, requestId: string | null) {
  const { supabase, agent } = await requireAgent();
  let q = supabase.from("listing_swipes").delete().eq("agent_id", agent.id).eq("listing_id", listingId);
  q = requestId ? q.eq("buyer_request_id", requestId) : q.is("buyer_request_id", null);
  const { error } = await q;
  return error ? { error: error.message } : { ok: true as const };
}

/** Form action from the shortlist tab. */
export async function removeFromShortlist(listingId: string, requestId: string | null): Promise<void> {
  await undoSwipe(listingId, requestId);
  revalidatePath("/discover");
}

/** Form action: forget every "pass" for this brief so those listings come back into the deck. */
export async function resetPasses(requestId: string | null): Promise<void> {
  const { supabase, agent } = await requireAgent();
  let q = supabase.from("listing_swipes").delete().eq("agent_id", agent.id).eq("decision", "pass");
  q = requestId ? q.eq("buyer_request_id", requestId) : q.is("buyer_request_id", null);
  await q;
  revalidatePath("/discover");
}
