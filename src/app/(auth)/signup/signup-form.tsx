"use client";

import { useActionState } from "react";
import { signUp } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormError, FormSuccess } from "@/components/ui";
import type { ActionState } from "@/lib/types";

export function SignupForm() {
  const [state, action] = useActionState<ActionState, FormData>(signUp, {});

  if (state.message) {
    return <FormSuccess message={state.message} />;
  }

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <Field label="Full name" htmlFor="full_name" error={state.fieldErrors?.full_name}>
        <input id="full_name" name="full_name" type="text" autoComplete="name" required />
      </Field>
      <Field label="Agency" htmlFor="agency_name" error={state.fieldErrors?.agency_name}>
        <input id="agency_name" name="agency_name" type="text" autoComplete="organization" required />
      </Field>
      <Field label="Phone" htmlFor="phone" hint="Optional. Only shared inside agreed Deal Rooms." error={state.fieldErrors?.phone}>
        <input id="phone" name="phone" type="tel" autoComplete="tel" />
      </Field>
      <Field label="Work email" htmlFor="email" error={state.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters with a letter and a number." error={state.fieldErrors?.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Creating profile…">
        Create agent profile
      </SubmitButton>
    </form>
  );
}
