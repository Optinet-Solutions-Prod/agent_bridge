import { CinematicLanding } from "@/components/landing/cinematic/landing";
import { SHOWCASE } from "@/data/portugal-showcase";
import { createClient, getUser } from "@/lib/supabase/server";
import type { OwnerLeadOverview } from "@/lib/types";

export default async function HomePage() {
  const user = await getUser().catch(() => null);
  let overview: OwnerLeadOverview | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("owner_lead_overview");
    overview = (data ?? null) as OwnerLeadOverview | null;
  } catch {
    overview = null;
  }

  return (
    <CinematicLanding homes={SHOWCASE} overview={overview} signedIn={!!user} />
  );
}
