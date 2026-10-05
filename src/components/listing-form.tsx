"use client";

import { useActionState } from "react";
import { EyeOff } from "lucide-react";
import { saveListing } from "@/app/(app)/listings/actions";
import { PhotoUploader } from "@/components/photo-uploader";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardBody, CardTitle, Field, FormError, LinkButton } from "@/components/ui";
import { FEATURES, LISTING_STATUS_LABEL, PROPERTY_TYPES, REGIONS } from "@/lib/constants";
import type { ActionState, Listing, ListingPrivate, ListingStatus } from "@/lib/types";

const STATUS_OPTIONS: ListingStatus[] = ["active", "draft", "under_offer", "withdrawn", "sold"];

export function ListingForm({
  agentId,
  listing,
  privateDetails,
}: {
  agentId: string;
  listing?: Listing;
  privateDetails?: ListingPrivate | null;
}) {
  const action = saveListing.bind(null, listing?.id ?? null);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <Card>
        <CardBody className="space-y-4">
          <CardTitle>What other agents will see</CardTitle>

          <Field label="Headline" htmlFor="title" error={fe.title} hint="e.g. Bright 3-bed with sea views and two parking spaces">
            <input id="title" name="title" type="text" defaultValue={listing?.title} required maxLength={120} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Property type" htmlFor="property_type" error={fe.property_type}>
              <select id="property_type" name="property_type" defaultValue={listing?.property_type ?? "Apartment"}>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Locality" htmlFor="locality" error={fe.locality} hint="Only the town is shown. Never the street.">
              <select id="locality" name="locality" defaultValue={listing?.locality ?? ""} required>
                <option value="" disabled>
                  Select a locality
                </option>
                {Object.entries(REGIONS).map(([region, towns]) => (
                  <optgroup key={region} label={region}>
                    {towns.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Status" htmlFor="status" error={fe.status}>
              <select id="status" name="status" defaultValue={listing?.status ?? "active"}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {LISTING_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Asking price (€)" htmlFor="price" error={fe.price}>
              <input id="price" name="price" type="number" min={0} step={1000} defaultValue={listing?.price} required />
            </Field>
            <Field label="Buyer-agent commission (%)" htmlFor="buyer_agent_commission_pct" error={fe.buyer_agent_commission_pct} hint="What you'll pay the agent who brings the buyer.">
              <input
                id="buyer_agent_commission_pct"
                name="buyer_agent_commission_pct"
                type="number"
                min={0}
                max={10}
                step={0.25}
                defaultValue={listing?.buyer_agent_commission_pct ?? 2.5}
                required
              />
            </Field>
            <Field label="Internal area (m²)" htmlFor="size_sqm" error={fe.size_sqm}>
              <input id="size_sqm" name="size_sqm" type="number" min={0} step={1} defaultValue={listing?.size_sqm ?? ""} />
            </Field>
            <Field label="Outdoor area (m²)" htmlFor="outdoor_sqm" error={fe.outdoor_sqm}>
              <input id="outdoor_sqm" name="outdoor_sqm" type="number" min={0} step={1} defaultValue={listing?.outdoor_sqm ?? ""} />
            </Field>
            <Field label="Bedrooms" htmlFor="bedrooms" error={fe.bedrooms}>
              <input id="bedrooms" name="bedrooms" type="number" min={0} step={1} defaultValue={listing?.bedrooms ?? ""} />
            </Field>
            <Field label="Bathrooms" htmlFor="bathrooms" error={fe.bathrooms}>
              <input id="bathrooms" name="bathrooms" type="number" min={0} step={1} defaultValue={listing?.bathrooms ?? ""} />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-slate-700">Features</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
              {FEATURES.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="features" value={f} defaultChecked={listing?.features.includes(f)} />
                  {f}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Description" htmlFor="description" error={fe.description} hint="Describe the property, not the street or landmarks next to it.">
            <textarea id="description" name="description" rows={5} defaultValue={listing?.description ?? ""} />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Photos</span>
            <PhotoUploader agentId={agentId} initial={listing?.photo_urls ?? []} />
          </div>
        </CardBody>
      </Card>

      <Card className="border-amber-200">
        <CardBody className="space-y-4">
          <div className="flex items-start gap-3">
            <EyeOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <CardTitle>Private details</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Stored separately and protected by database row-level security. Only you can read these — until a Deal Room
                for this listing has been accepted by both sides.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Address line" htmlFor="address_line" error={fe.address_line}>
              <input id="address_line" name="address_line" type="text" defaultValue={privateDetails?.address_line ?? ""} />
            </Field>
            <Field label="Street" htmlFor="street" error={fe.street}>
              <input id="street" name="street" type="text" defaultValue={privateDetails?.street ?? ""} />
            </Field>
            <Field label="Block / building name" htmlFor="block_or_building" error={fe.block_or_building}>
              <input id="block_or_building" name="block_or_building" type="text" defaultValue={privateDetails?.block_or_building ?? ""} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Viewing arrangements" htmlFor="viewing_notes" hint="Shared with the buyer agent after the Deal Room is agreed." error={fe.viewing_notes}>
              <textarea id="viewing_notes" name="viewing_notes" rows={3} defaultValue={privateDetails?.viewing_notes ?? ""} />
            </Field>
            <Field label="Internal notes" htmlFor="internal_notes" hint="Never shared. Owner situation, keys, etc." error={fe.internal_notes}>
              <textarea id="internal_notes" name="internal_notes" rows={3} defaultValue={privateDetails?.internal_notes ?? ""} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <LinkButton href={listing ? `/listings/${listing.id}` : "/listings"} variant="ghost">
          Cancel
        </LinkButton>
        <SubmitButton pendingText="Saving…">{listing ? "Save changes" : "Publish listing"}</SubmitButton>
      </div>
    </form>
  );
}
