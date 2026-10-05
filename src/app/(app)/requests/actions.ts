"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { requireAgent } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import type { ActionState, RequestStatus } from "@/lib/types";
import { num, str, strs } from "@/lib/utils";

const RequestSchema = z
  .object({
    title: z.string().trim().min(3, { error: "Describe the buyer in a short headline." }).max(120),
    property_types: z.array(z.string()),
    localities: z.array(z.string()),
    min_price: z.number().min(0).nullable(),
    max_price: z.number().min(0).nullable(),
    min_bedrooms: z.number().int().min(0).nullable(),
    min_size_sqm: z.number().min(0).nullable(),
    must_have_features: z.array(z.string()),
    notes: z.string().max(3000).nullable(),
    status: z.enum(["active", "fulfilled", "closed"]),
  })
  .refine((d) => d.min_price == null || d.max_price == null || d.min_price <= d.max_price, {
    error: "Minimum budget must be below the maximum.",
    path: ["max_price"],
  });

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function saveRequest(requestId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, agent } = await requireAgent();

  const parsed = RequestSchema.safeParse({
    title: str(formData, "title") ?? "",
    property_types: strs(formData, "property_types"),
    localities: strs(formData, "localities"),
    min_price: num(formData, "min_price"),
    max_price: num(formData, "max_price"),
    min_bedrooms: num(formData, "min_bedrooms"),
    min_size_sqm: num(formData, "min_size_sqm"),
    must_have_features: strs(formData, "must_have_features"),
    notes: str(formData, "notes"),
    status: str(formData, "status") ?? "active",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  let id = requestId;
  if (id) {
    const { error } = await supabase.from("buyer_requests").update(parsed.data).eq("id", id).eq("agent_id", agent.id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("buyer_requests")
      .insert({ ...parsed.data, agent_id: agent.id })
      .select("id")
      .single();
    if (error) return { error: error.message };
    id = data.id as string;
  }

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  redirect(`/requests/${id}`);
}

export async function setRequestStatus(requestId: string, status: RequestStatus) {
  const { supabase, agent } = await requireAgent();
  await supabase.from("buyer_requests").update({ status }).eq("id", requestId).eq("agent_id", agent.id);
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
  revalidatePath("/dashboard");
}

export async function deleteRequest(requestId: string) {
  const { supabase, agent } = await requireAgent();
  await supabase.from("buyer_requests").delete().eq("id", requestId).eq("agent_id", agent.id);
  revalidatePath("/requests");
  revalidatePath("/dashboard");
  redirect("/requests?mine=1");
}

/**
 * Listing agent side of matching: offer one of my listings to the agent who
 * posted a buyer request. Opens the anonymous conversation and drops a first
 * message in it.
 */
export async function proposeListingForRequest(requestId: string, listingId: string) {
  const { supabase, agent } = await requireAgent();

  const [{ data: request }, { data: listing }] = await Promise.all([
    supabase.from("buyer_requests").select("id, agent_id, title").eq("id", requestId).single(),
    supabase.from("listings").select("id, agent_id, title, price, currency, locality").eq("id", listingId).eq("agent_id", agent.id).single(),
  ]);
  if (!request || !listing) throw new Error("Request or listing not found.");
  if (request.agent_id === agent.id) redirect(`/requests/${requestId}`);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_agent_id", request.agent_id)
    .maybeSingle();

  if (existing) redirect(`/messages/${existing.id}`);

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      buyer_agent_id: request.agent_id,
      listing_agent_id: agent.id,
      buyer_request_id: requestId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("messages").insert({
    conversation_id: created.id,
    sender_id: agent.id,
    body: `Hi — I have stock that matches your request "${request.title}": ${listing.title} in ${listing.locality}, asking ${formatPrice(listing.price, listing.currency)}. Happy to share more details here.`,
  });

  revalidatePath("/messages");
  redirect(`/messages/${created.id}`);
}
