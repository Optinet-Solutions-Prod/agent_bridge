"use server";

import { revalidatePath } from "next/cache";
import { requireAgent } from "@/lib/auth";
import type { Message } from "@/lib/types";

export async function sendMessage(conversationId: string, body: string): Promise<{ message?: Message; error?: string }> {
  const text = body.trim();
  if (!text) return { error: "Message is empty." };
  if (text.length > 4000) return { error: "Keep messages under 4000 characters." };

  const { supabase, agent } = await requireAgent();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: agent.id, body: text })
    .select("*")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/messages");
  return { message: data as Message };
}
