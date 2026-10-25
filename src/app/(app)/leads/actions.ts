"use server";

import { revalidatePath } from "next/cache";
import { requireAgent } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/constants";
import type { LeadStatus } from "@/lib/types";
import { str } from "@/lib/utils";

/** Form action: set my status on a lead (each agent keeps their own). */
export async function setLeadStatus(formData: FormData): Promise<void> {
  const { supabase, agent } = await requireAgent();
  const leadId = str(formData, "lead_id");
  const status = str(formData, "status") as LeadStatus | null;
  if (!leadId || !status || !LEAD_STATUSES.includes(status)) return;
  await supabase
    .from("owner_lead_tracking")
    .upsert({ lead_id: leadId, agent_id: agent.id, status }, { onConflict: "lead_id,agent_id" });
  revalidatePath("/leads/listings");
}

/** Form action: save my private notes on a lead. */
export async function saveLeadNotes(formData: FormData): Promise<void> {
  const { supabase, agent } = await requireAgent();
  const leadId = str(formData, "lead_id");
  if (!leadId) return;
  const notes = str(formData, "notes");
  const { data: existing } = await supabase
    .from("owner_lead_tracking")
    .select("status")
    .eq("lead_id", leadId)
    .eq("agent_id", agent.id)
    .maybeSingle();
  await supabase
    .from("owner_lead_tracking")
    .upsert({ lead_id: leadId, agent_id: agent.id, status: existing?.status ?? "new", notes }, { onConflict: "lead_id,agent_id" });
  revalidatePath("/leads/listings");
}

/** Form action: set my status on a registered rental. */
export async function setRegisterStatus(formData: FormData): Promise<void> {
  const { supabase, agent } = await requireAgent();
  const nr = str(formData, "rnal_nr");
  const status = str(formData, "status") as LeadStatus | null;
  if (!nr || !status || !LEAD_STATUSES.includes(status)) return;
  await supabase
    .from("register_tracking")
    .upsert({ rnal_nr: nr, agent_id: agent.id, status }, { onConflict: "rnal_nr,agent_id" });
  revalidatePath("/leads");
}

/** Form action: save my private notes on a registered rental. */
export async function saveRegisterNotes(formData: FormData): Promise<void> {
  const { supabase, agent } = await requireAgent();
  const nr = str(formData, "rnal_nr");
  if (!nr) return;
  const notes = str(formData, "notes");
  const { data: existing } = await supabase
    .from("register_tracking")
    .select("status")
    .eq("rnal_nr", nr)
    .eq("agent_id", agent.id)
    .maybeSingle();
  await supabase
    .from("register_tracking")
    .upsert({ rnal_nr: nr, agent_id: agent.id, status: existing?.status ?? "new", notes }, { onConflict: "rnal_nr,agent_id" });
  revalidatePath("/leads");
}
