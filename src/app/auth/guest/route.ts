import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE, GUEST_EMAIL } from "@/lib/demo";
import { demoPassword } from "@/lib/demo-server";
import { createClient } from "@/lib/supabase/server";

/**
 * Demo mode: signs the visitor in as the shared guest agent and sends them on.
 * The proxy redirects here instead of /login when there is no session.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const raw = searchParams.get("next") ?? "/dashboard";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  if (!DEMO_MODE) return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: GUEST_EMAIL, password: demoPassword() });
  if (error) return NextResponse.redirect(`${origin}/login?error=guest&next=${encodeURIComponent(next)}`);

  return NextResponse.redirect(`${origin}${next}`);
}
