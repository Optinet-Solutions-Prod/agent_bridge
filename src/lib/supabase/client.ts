"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

/** Supabase client for Client Components (photo uploads, realtime chat). */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
