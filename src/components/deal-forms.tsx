"use client";

import { useActionState } from "react";
import { acceptDealRoom, closeDealRoom, openDealRoom } from "@/app/(app)/deals/actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormError, FormSuccess } from "@/components/ui";
import type { ActionState } from "@/lib/types";

function AgreeCheckbox({ id = "agree" }: { id?: string }) {
  return (
    <label htmlFor={id} className="flex items-start gap-2 text-sm text-slate-700">
      <input id={id} name="agree" type="checkbox" required className="mt-0.5" />
      <span>
        I have read and accept the co-broker terms above on behalf of myself and my agency. I understand the agreed commission and
        AgentBridge fee apply even if we continue outside the platform.
      </span>
    </label>
  );
}

export function OpenDealRoomForm({ conversationId, iAmBuyer }: { conversationId: string; iAmBuyer: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(openDealRoom, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="conversation_id" value={conversationId} />
      <FormError message={state.error} />
      <Field
        label={iAmBuyer ? "About your buyer (shared with the listing agent)" : "Note to the buyer agent"}
        htmlFor="brief"
        hint={iAmBuyer ? "Position, timeline, financing. Still no names." : "Optional."}
      >
        <textarea id="brief" name="brief" rows={3} maxLength={1000} />
      </Field>
      <AgreeCheckbox />
      <SubmitButton className="w-full" pendingText="Opening Deal Room…">
        Accept terms &amp; open Deal Room
      </SubmitButton>
    </form>
  );
}

export function AcceptDealRoomForm({ dealId }: { dealId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(acceptDealRoom.bind(null, dealId), {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <FormSuccess message={state.message} />
      <AgreeCheckbox id="agree-accept" />
      <SubmitButton className="w-full" pendingText="Accepting…">
        Accept terms &amp; reveal
      </SubmitButton>
    </form>
  );
}

export function CloseDealRoomForm({ dealId, askingPrice }: { dealId: string; askingPrice: number }) {
  const [state, action] = useActionState<ActionState, FormData>(closeDealRoom.bind(null, dealId), {});
  return (
    <form action={action} className="space-y-3">
      <FormError message={state.error} />
      <FormSuccess message={state.message} />
      <Field label="Final sale price (€)" htmlFor="sale_price" error={state.fieldErrors?.sale_price}>
        <input id="sale_price" name="sale_price" type="number" min={1} step={1000} defaultValue={askingPrice} required />
      </Field>
      <SubmitButton className="w-full" variant="secondary" pendingText="Closing…">
        Mark deal as closed
      </SubmitButton>
    </form>
  );
}
