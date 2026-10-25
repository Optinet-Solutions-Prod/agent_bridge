import "server-only";
import { cache } from "react";
import { requireAgent } from "@/lib/auth";
import type { LeadStatus, RegisterOverview, TourismOverview } from "@/lib/types";

/*
 * Request-scoped loaders for the owner-leads pages. Each page streams its
 * summary and its table in separate Suspense boundaries; React's cache()
 * makes both read the same result instead of querying twice.
 */

export const getRegisterOverview = cache(async () => {
  const { supabase } = await requireAgent();
  const { data, error } = await supabase.rpc("register_overview");
  return { overview: (data ?? null) as RegisterOverview | null, missing: !!error };
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
  const { supabase } = await requireAgent();
  const { data, error } = await supabase.rpc("tourism_overview");
  return { overview: (data ?? null) as TourismOverview | null, missing: !!error };
});

export const getTourismTracking = cache(async () => {
  const { supabase, agent } = await requireAgent();
  const { data } = await supabase.from("tourism_tracking").select("rnet_nr, status").eq("agent_id", agent.id);
  return (data ?? []) as { rnet_nr: string; status: LeadStatus }[];
});
