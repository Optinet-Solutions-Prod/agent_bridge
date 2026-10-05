"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { requireAgent } from "@/lib/auth";
import { PROPERTY_TYPES, LOCALITIES, regionOf } from "@/lib/constants";
import type { ActionState, ListingStatus } from "@/lib/types";
import { num, str, strs } from "@/lib/utils";

const ListingSchema = z.object({
  title: z.string().trim().min(3, { error: "Give the listing a headline (3+ characters)." }).max(120, { error: "Keep the headline under 120 characters." }),
  property_type: z.enum(PROPERTY_TYPES, { error: "Choose a property type." }),
  locality: z.enum(LOCALITIES as [string, ...string[]], { error: "Choose a locality." }),
  status: z.enum(["draft", "active", "under_offer", "sold", "withdrawn"]),
  price: z.number({ error: "Enter an asking price." }).min(0, { error: "Price cannot be negative." }),
  buyer_agent_commission_pct: z
    .number({ error: "Enter the buyer-agent commission." })
    .min(0, { error: "Commission cannot be negative." })
    .max(10, { error: "Commission above 10% is not allowed." }),
  bedrooms: z.number().int().min(0).nullable(),
  bathrooms: z.number().int().min(0).nullable(),
  size_sqm: z.number().min(0).nullable(),
  outdoor_sqm: z.number().min(0).nullable(),
  features: z.array(z.string()),
  description: z.string().max(5000).nullable(),
  photo_urls: z.array(z.url()).max(12),
});

const PrivateSchema = z.object({
  address_line: z.string().max(200).nullable(),
  street: z.string().max(200).nullable(),
  block_or_building: z.string().max(200).nullable(),
  viewing_notes: z.string().max(2000).nullable(),
  internal_notes: z.string().max(2000).nullable(),
});

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function saveListing(listingId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, agent } = await requireAgent();

  const parsed = ListingSchema.safeParse({
    title: str(formData, "title") ?? "",
    property_type: str(formData, "property_type"),
    locality: str(formData, "locality"),
    status: str(formData, "status") ?? "active",
    price: num(formData, "price"),
    buyer_agent_commission_pct: num(formData, "buyer_agent_commission_pct"),
    bedrooms: num(formData, "bedrooms"),
    bathrooms: num(formData, "bathrooms"),
    size_sqm: num(formData, "size_sqm"),
    outdoor_sqm: num(formData, "outdoor_sqm"),
    features: strs(formData, "features"),
    description: str(formData, "description"),
    photo_urls: strs(formData, "photo_urls"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const parsedPrivate = PrivateSchema.safeParse({
    address_line: str(formData, "address_line"),
    street: str(formData, "street"),
    block_or_building: str(formData, "block_or_building"),
    viewing_notes: str(formData, "viewing_notes"),
    internal_notes: str(formData, "internal_notes"),
  });
  if (!parsedPrivate.success) return { fieldErrors: fieldErrors(parsedPrivate.error) };

  const row = { ...parsed.data, region: regionOf(parsed.data.locality), currency: "EUR" };

  let id = listingId;
  if (id) {
    const { error } = await supabase.from("listings").update(row).eq("id", id).eq("agent_id", agent.id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("listings")
      .insert({ ...row, agent_id: agent.id })
      .select("id")
      .single();
    if (error) return { error: friendlyDbError(error.message) };
    id = data.id as string;
  }

  const { error: privateError } = await supabase.from("listing_private").upsert({ listing_id: id, ...parsedPrivate.data });
  if (privateError) return { error: privateError.message };

  revalidatePath("/listings");
  revalidatePath("/dashboard");
  redirect(`/listings/${id}`);
}

export async function setListingStatus(listingId: string, status: ListingStatus) {
  const { supabase, agent } = await requireAgent();
  await supabase.from("listings").update({ status }).eq("id", listingId).eq("agent_id", agent.id);
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/listings");
  revalidatePath("/dashboard");
}

export async function deleteListing(listingId: string) {
  const { supabase, agent } = await requireAgent();
  await supabase.from("listings").delete().eq("id", listingId).eq("agent_id", agent.id);
  revalidatePath("/listings");
  revalidatePath("/dashboard");
  redirect("/listings?mine=1");
}

/**
 * Opens (or re-opens) the anonymous conversation between the current agent and
 * the listing agent about a listing, then goes to it.
 */
export async function startConversation(listingId: string, buyerRequestId?: string | null) {
  const { supabase, agent } = await requireAgent();

  const { data: listing } = await supabase.from("listings").select("id, agent_id").eq("id", listingId).single();
  if (!listing) throw new Error("Listing not found.");
  if (listing.agent_id === agent.id) redirect(`/listings/${listingId}`);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_agent_id", agent.id)
    .maybeSingle();

  if (existing) redirect(`/messages/${existing.id}`);

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      buyer_agent_id: agent.id,
      listing_agent_id: listing.agent_id,
      buyer_request_id: buyerRequestId ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/messages");
  redirect(`/messages/${created.id}`);
}

function friendlyDbError(message: string) {
  if (message.includes("Listing limit reached")) {
    return "You've reached the 3 live listings allowed on the Free plan. Upgrade in Settings to add more.";
  }
  return message;
}
