"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireAgent } from "@/lib/auth";
import type { ActionState } from "@/lib/types";
import { str } from "@/lib/utils";

const IdentitySchema = z.object({
  full_name: z.string().trim().min(2, { error: "Enter your full name." }).max(120),
  agency_name: z.string().trim().min(2, { error: "Enter your agency name." }).max(120),
  phone: z.string().trim().max(40).nullable(),
  license_no: z.string().trim().max(60).nullable(),
});

export async function updateIdentity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = IdentitySchema.safeParse({
    full_name: str(formData, "full_name") ?? "",
    agency_name: str(formData, "agency_name") ?? "",
    phone: str(formData, "phone"),
    license_no: str(formData, "license_no"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }

  const { supabase, agent } = await requireAgent();
  const { error } = await supabase.from("agent_identities").update(parsed.data).eq("agent_id", agent.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { message: "Profile saved. These details stay private until a Deal Room is agreed." };
}
