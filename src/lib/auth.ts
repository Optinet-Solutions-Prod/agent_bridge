import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Agent } from "@/lib/types";

/**
 * Server-side guard for app pages and actions: returns the Supabase client,
 * the auth user and the agent's anonymous profile, or redirects to /login.
 *
 * Memoised per request with React cache() so the layout and the page share a
 * single lookup. The JWT is verified locally by getClaims() (ES256 via the
 * cached JWKS), so this costs one database round trip rather than two auth
 * round trips plus one.
 */
export const requireAgent = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) redirect("/login");

  const user = { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };

  const { data: agent } = await supabase.from("agents").select("*").eq("id", user.id).maybeSingle();
  if (!agent) {
    throw new Error(
      "Your agent profile was not found. Apply supabase/migrations/0001_init.sql to your Supabase project, then sign up again.",
    );
  }

  return { supabase, user, agent: agent as Agent };
});
