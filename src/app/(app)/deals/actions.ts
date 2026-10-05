"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/auth";
import type { ActionState } from "@/lib/types";
import { num, str } from "@/lib/utils";

export async function openDealRoom(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const conversationId = str(formData, "conversation_id");
  const brief = str(formData, "brief");
  const agreed = formData.get("agree") === "on";

  if (!conversationId) return { error: "Missing conversation." };
  if (!agreed) return { error: "You need to accept the co-broker terms to open a Deal Room." };

  const { supabase } = await requireAgent();
  const { data, error } = await supabase.rpc("open_deal_room", { conv: conversationId, brief });
  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath("/messages");
  redirect(`/deals/${data as string}`);
}

export async function acceptDealRoom(dealId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("agree") !== "on") return { error: "You need to accept the co-broker terms." };

  const { supabase } = await requireAgent();
  const { error } = await supabase.rpc("accept_deal_room", { deal: dealId });
  if (error) return { error: error.message };

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/messages");
  revalidatePath("/dashboard");
  return { message: "Terms accepted." };
}

export async function cancelDealRoom(dealId: string) {
  const { supabase } = await requireAgent();
  const { error } = await supabase.rpc("cancel_deal_room", { deal: dealId });
  if (error) throw new Error(error.message);
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/messages");
}

export async function closeDealRoom(dealId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const salePrice = num(formData, "sale_price");
  if (!salePrice || salePrice <= 0) return { fieldErrors: { sale_price: "Enter the final sale price." } };

  const { supabase } = await requireAgent();
  const { error } = await supabase.rpc("close_deal_room", { deal: dealId, final_price: salePrice });
  if (error) return { error: error.message };

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/listings");
  revalidatePath("/dashboard");
  return { message: "Deal closed. Congratulations!" };
}
