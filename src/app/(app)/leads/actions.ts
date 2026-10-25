"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAgent } from "@/lib/auth";
import { REGISTER_OVERVIEW_TAG } from "@/lib/leads-data";
import { LEAD_STATUSES } from "@/lib/constants";
import { decodeRnalPage, parseRnal, RNAL_RECORD_URL } from "@/lib/rnal";
import type { LeadStatus } from "@/lib/types";
import { str } from "@/lib/utils";

/* ---------------------------------------------------------------- Portal listings */

/** Form action: set my status on a lead (each agent keeps their own). */
export async function setLeadStatus(formData: FormData): Promise<void> {
  const { supabase, agent } = await requireAgent();
  const leadId = str(formData, "lead_id");
  const status = str(formData, "status") as LeadStatus | null;
  if (!leadId || !status || !LEAD_STATUSES.includes(status)) return;
  await supabase.from("owner_lead_tracking").upsert({ lead_id: leadId, agent_id: agent.id, status }, { onConflict: "lead_id,agent_id" });
  revalidatePath("/leads/listings");
}

/** Form action: save my private notes on a lead. */
export async function saveLeadNotes(formData: FormData): Promise<void> {
  const { supabase, agent } = await requireAgent();
  const leadId = str(formData, "lead_id");
  if (!leadId) return;
  const notes = str(formData, "notes");
  const { data: existing } = await supabase.from("owner_lead_tracking").select("status").eq("lead_id", leadId).eq("agent_id", agent.id).maybeSingle();
  await supabase
    .from("owner_lead_tracking")
    .upsert({ lead_id: leadId, agent_id: agent.id, status: existing?.status ?? "new", notes }, { onConflict: "lead_id,agent_id" });
  revalidatePath("/leads/listings");
}

/* ------------------------------------------------ Registers (holiday rentals, tourist properties) */

const SOURCES = {
  register: { table: "register_tracking", key: "rnal_nr", path: "/leads" },
  tourism: { table: "tourism_tracking", key: "rnet_nr", path: "/leads/tourism" },
} as const;
type SourceKind = keyof typeof SOURCES;
const sourceOf = (formData: FormData) => {
  const kind = str(formData, "kind") as SourceKind | null;
  return kind && kind in SOURCES ? SOURCES[kind] : null;
};

/** Form action: set my status on a register record. */
export async function setSourceStatus(formData: FormData): Promise<void> {
  const src = sourceOf(formData);
  const id = str(formData, "id");
  const status = str(formData, "status") as LeadStatus | null;
  if (!src || !id || !status || !LEAD_STATUSES.includes(status)) return;
  const { supabase, agent } = await requireAgent();
  await supabase.from(src.table).upsert({ [src.key]: id, agent_id: agent.id, status }, { onConflict: `${src.key},agent_id` });
  revalidatePath(src.path);
}

/** Form action: save my private notes on a register record. */
export async function saveSourceNotes(formData: FormData): Promise<void> {
  const src = sourceOf(formData);
  const id = str(formData, "id");
  if (!src || !id) return;
  const { supabase, agent } = await requireAgent();
  const notes = str(formData, "notes");
  const { data: existing } = await supabase.from(src.table).select("status").eq(src.key, id).eq("agent_id", agent.id).maybeSingle();
  await supabase
    .from(src.table)
    .upsert({ [src.key]: id, agent_id: agent.id, status: (existing as { status?: LeadStatus } | null)?.status ?? "new", notes }, { onConflict: `${src.key},agent_id` });
  revalidatePath(src.path);
}

/**
 * Form action (admin only): open one official holiday-rental record and save
 * who runs it. One record per click, the same as looking it up by hand.
 */
export async function fetchOperator(formData: FormData): Promise<void> {
  const nr = str(formData, "id");
  if (!nr || !/^\d{1,7}$/.test(nr)) return;
  const { supabase } = await requireAgent();
  const { data: allowed } = await supabase.rpc("can_see_owner_contacts");
  if (allowed !== true) return;

  const res = await fetch(RNAL_RECORD_URL + nr, {
    headers: { "User-Agent": "Mozilla/5.0 (Ponte)", "Accept-Language": "pt-PT,pt;q=0.9" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);
  if (!res?.ok) return;
  const rec = parseRnal(nr, decodeRnalPage(await res.arrayBuffer()));
  if (!rec) return;

  const first = rec.operators[0];
  await supabase.rpc("save_register_operator", {
    p_nr: nr,
    p_rental: {
      name: rec.name,
      modality: rec.modality,
      guests: rec.guests,
      rooms: rec.rooms,
      beds: rec.beds,
      registered_on: rec.registered_on,
      opened_on: rec.opened_on,
      operator_role: first?.role_en ?? null,
      operator_kind: first?.kind ?? null,
      operators: rec.operators.length,
      has_email: rec.operators.some((o) => o.email),
      has_phone: rec.operators.some((o) => o.phone),
      nipc: rec.operators.find((o) => o.nipc)?.nipc ?? null,
    },
    p_contact: {
      address: rec.address,
      // NIF of private people is never stored; companies keep their NIPC in the rental row.
      operators: rec.operators.map(({ role, role_en, kind, name, email, phone }) => ({ role, role_en, kind, name, email, phone })),
    },
  });
  revalidateTag(REGISTER_OVERVIEW_TAG, { expire: 0 });
  revalidatePath("/leads");
}
