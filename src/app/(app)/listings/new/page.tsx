import type { Metadata } from "next";
import { ListingForm } from "@/components/listing-form";
import { PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { PLANS } from "@/lib/constants";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  const { supabase, agent } = await requireAgent();
  const limit = PLANS[agent.plan].listingLimit;

  let liveCount = 0;
  if (limit !== null) {
    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agent.id)
      .in("status", ["draft", "active", "under_offer"]);
    liveCount = count ?? 0;
  }

  return (
    <>
      <PageHeader
        title="New listing"
        description={
          limit !== null
            ? `${liveCount} of ${limit} live listings used on the ${PLANS[agent.plan].name} plan.`
            : "Unlimited listings on your plan."
        }
      />
      <ListingForm agentId={agent.id} />
    </>
  );
}
