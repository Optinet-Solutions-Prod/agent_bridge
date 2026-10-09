import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE } from "@/lib/demo";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

const PROTECTED_PREFIXES = ["/dashboard", "/listings", "/discover", "/requests", "/messages", "/deals", "/settings"];
const AUTH_ONLY_PATHS = ["/login", "/signup"];

/**
 * Refreshes the Supabase session cookie on every request and applies optimistic
 * route protection. Data access is still guarded by RLS in the database.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Env not configured yet: let pages render and show the setup error.
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not add logic between createServerClient and getClaims: it can cause
  // random logouts because the session cookie would not be refreshed.
  // getClaims() verifies the ES256 token locally against the cached JWKS, so
  // this normally costs no network round trip (it only refreshes when expired).
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthOnly = AUTH_ONLY_PATHS.includes(pathname);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    // Demo mode: no login wall — sign the visitor in as the guest agent instead.
    url.pathname = DEMO_MODE ? "/auth/guest" : "/login";
    url.search = "";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (user && isAuthOnly) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
