import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingForm } from "@/components/listing-form";
import { PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import type { Listing, ListingPrivate } from "@/lib/types";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: PageProps<"/listings/[id]/edit">) {
  const { id } = await params;
  const { supabase, agent } = await requireAgent();

  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).eq("agent_id", agent.id).maybeSingle();
  if (!listing) notFound();

  const { data: privateDetails } = await supabase.from("listing_private").select("*").eq("listing_id", id).maybeSingle();

  return (
    <>
      <PageHeader title="Edit listing" description={listing.title} />
      <ListingForm agentId={agent.id} listing={listing as Listing} privateDetails={privateDetails as ListingPrivate | null} />
    </>
  );
}
