import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { requireAgent } from "@/lib/auth";
import type { LeadStatus, RegisterOverview, TourismOverview } from "@/lib/types";

/*
 * Request-scoped loaders for the owner-leads pages. Each page streams its
 * summary and its table in separate Suspense boundaries; React's cache()
 * makes both read the same result instead of querying twice.
 */

/** Cache tags; fetchOperator clears the register one so the admin sees new counts at once. */
export const REGISTER_OVERVIEW_TAG = "register-overview";
export const TOURISM_OVERVIEW_TAG = "tourism-overview";

// The header counts are identical for every visitor and cost a few hundred ms over
// ~112k rows, so they are cached for five minutes. Cached code can't read cookies,
// hence a sign-in-free client (migration 0008 lets anon call the two aggregates).
const anon = () =>
  createAnonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

async function aggregate(fn: "register_overview" | "tourism_overview") {
  const { data, error } = await anon().rpc(fn);
  if (error) throw new Error(error.message); // thrown results are not cached
  return data;
}
const cachedRegisterOverview = unstable_cache(() => aggregate("register_overview"), ["register-overview-v1"], { revalidate: 300, tags: [REGISTER_OVERVIEW_TAG] });
const cachedTourismOverview = unstable_cache(() => aggregate("tourism_overview"), ["tourism-overview-v1"], { revalidate: 300, tags: [TOURISM_OVERVIEW_TAG] });

/** Cached when possible; falls back to the signed-in client (e.g. before migration 0008). */
async function overview(fn: "register_overview" | "tourism_overview", cached: () => Promise<unknown>) {
  try {
    return { data: await cached(), missing: false };
  } catch {
    const { supabase } = await requireAgent();
    const { data, error } = await supabase.rpc(fn);
    return { data, missing: !!error };
  }
}

export const getRegisterOverview = cache(async () => {
  const { data, missing } = await overview("register_overview", cachedRegisterOverview);
  return { overview: (data ?? null) as RegisterOverview | null, missing };
});

export const getRegisterTracking = cache(async () => {
  const { supabase, agent } = await requireAgent();
  const { data } = await supabase.from("register_tracking").select("rnal_nr, status").eq("agent_id", agent.id);
  return (data ?? []) as { rnal_nr: string; status: LeadStatus }[];
});

export const getCanSeeContacts = cache(async () => {
  const { supabase } = await requireAgent();
  const { data } = await supabase.rpc("can_see_owner_contacts");
  return data === true;
});

export const getTourismOverview = cache(async () => {
  const { data, missing } = await overview("tourism_overview", cachedTourismOverview);
  return { overview: (data ?? null) as TourismOverview | null, missing };
});

export const getTourismTracking = cache(async () => {
  const { supabase, agent } = await requireAgent();
  const { data } = await supabase.from("tourism_tracking").select("rnet_nr, status").eq("agent_id", agent.id);
  return (data ?? []) as { rnet_nr: string; status: LeadStatus }[];
});
