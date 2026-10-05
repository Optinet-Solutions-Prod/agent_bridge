import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Agent } from "@/lib/types";

/**
 * Server-side guard for app pages and actions: returns the Supabase client,
 * the auth user and the agent's anonymous profile, or redirects to /login.
 */
export async function requireAgent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: agent } = await supabase.from("agents").select("*").eq("id", user.id).maybeSingle();
  if (!agent) {
    throw new Error(
      "Your agent profile was not found. Apply supabase/migrations/0001_init.sql to your Supabase project, then sign up again.",
    );
  }

  return { supabase, user, agent: agent as Agent };
}
