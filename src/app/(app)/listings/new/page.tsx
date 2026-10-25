import type { Metadata } from "next";
import { ListingForm } from "@/components/listing-form";
import { PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  const { agent } = await requireAgent();

  return (
    <>
      <PageHeader title="New listing" description="Everything except the exact address and your identity is visible to every agent on the network." />
      <ListingForm agentId={agent.id} />
    </>
  );
}
