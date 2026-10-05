"use client";

import { useActionState } from "react";
import { updateIdentity } from "@/app/(app)/settings/actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormError, FormSuccess } from "@/components/ui";
import type { ActionState, AgentIdentity } from "@/lib/types";

export function IdentityForm({ identity }: { identity: AgentIdentity | null }) {
  const [state, action] = useActionState<ActionState, FormData>(updateIdentity, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <FormSuccess message={state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name" error={fe.full_name}>
          <input id="full_name" name="full_name" type="text" defaultValue={identity?.full_name ?? ""} required />
        </Field>
        <Field label="Agency" htmlFor="agency_name" error={fe.agency_name}>
          <input id="agency_name" name="agency_name" type="text" defaultValue={identity?.agency_name ?? ""} required />
        </Field>
        <Field label="Phone" htmlFor="phone" error={fe.phone}>
          <input id="phone" name="phone" type="tel" defaultValue={identity?.phone ?? ""} />
        </Field>
        <Field label="Licence number" htmlFor="license_no" error={fe.license_no} hint="Shown to counterparties after a Deal Room is agreed.">
          <input id="license_no" name="license_no" type="text" defaultValue={identity?.license_no ?? ""} />
        </Field>
        <Field label="Email" htmlFor="email" hint="Your login email. Change it from your account provider.">
          <input id="email" type="email" value={identity?.email ?? ""} disabled readOnly />
        </Field>
      </div>
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}
