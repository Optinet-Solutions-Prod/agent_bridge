"use client";

import { useActionState } from "react";
import { saveRequest } from "@/app/(app)/requests/actions";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardBody, CardTitle, Field, FormError, LinkButton } from "@/components/ui";
import { FEATURES, PROPERTY_TYPES, REGIONS } from "@/lib/constants";
import type { ActionState, BuyerRequest } from "@/lib/types";

export function RequestForm({ request }: { request?: BuyerRequest }) {
  const action = saveRequest.bind(null, request?.id ?? null);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <Card>
        <CardBody className="space-y-4">
          <CardTitle>Who is your buyer looking for?</CardTitle>
          <p className="text-sm text-slate-600">
            Other agents see this request anonymously and can offer matching stock. Your buyer&apos;s identity is never part of
            it.
          </p>

          <Field label="Headline" htmlFor="title" error={fe.title} hint="e.g. Cash buyer seeking 3-bed penthouse in Sliema under €900k">
            <input id="title" name="title" type="text" defaultValue={request?.title} required maxLength={120} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Min budget (€)" htmlFor="min_price" error={fe.min_price}>
              <input id="min_price" name="min_price" type="number" min={0} step={10000} defaultValue={request?.min_price ?? ""} />
            </Field>
            <Field label="Max budget (€)" htmlFor="max_price" error={fe.max_price}>
              <input id="max_price" name="max_price" type="number" min={0} step={10000} defaultValue={request?.max_price ?? ""} />
            </Field>
            <Field label="Min bedrooms" htmlFor="min_bedrooms" error={fe.min_bedrooms}>
              <input id="min_bedrooms" name="min_bedrooms" type="number" min={0} step={1} defaultValue={request?.min_bedrooms ?? ""} />
            </Field>
            <Field label="Min internal area (m²)" htmlFor="min_size_sqm" error={fe.min_size_sqm}>
              <input id="min_size_sqm" name="min_size_sqm" type="number" min={0} step={1} defaultValue={request?.min_size_sqm ?? ""} />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-slate-700">Property types (leave empty for any)</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
              {PROPERTY_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="property_types" value={t} defaultChecked={request?.property_types.includes(t)} />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Localities (leave empty for anywhere)" htmlFor="localities" hint="Hold Ctrl / Cmd to select several." error={fe.localities}>
            <select id="localities" name="localities" multiple size={8} defaultValue={request?.localities ?? []}>
              {Object.entries(REGIONS).map(([region, towns]) => (
                <optgroup key={region} label={region}>
                  {towns.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-slate-700">Must-have features</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
              {FEATURES.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="must_have_features" value={f} defaultChecked={request?.must_have_features.includes(f)} />
                  {f}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Notes for other agents" htmlFor="notes" error={fe.notes} hint="Timeline, financing, flexibility — nothing that identifies your client.">
            <textarea id="notes" name="notes" rows={4} defaultValue={request?.notes ?? ""} />
          </Field>

          {request && (
            <Field label="Status" htmlFor="status" error={fe.status}>
              <select id="status" name="status" defaultValue={request.status}>
                <option value="active">Active</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <LinkButton href={request ? `/requests/${request.id}` : "/requests"} variant="ghost">
          Cancel
        </LinkButton>
        <SubmitButton pendingText="Saving…">{request ? "Save changes" : "Post buyer request"}</SubmitButton>
      </div>
    </form>
  );
}
