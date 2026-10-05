"use client";

import { useActionState } from "react";
import { signIn } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormError } from "@/components/ui";
import type { ActionState } from "@/lib/types";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<ActionState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormError message={state.error} />
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" error={state.fieldErrors?.password}>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}
