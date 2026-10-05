import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { Button, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { PROPERTY_TYPES, REGIONS } from "@/lib/constants";
import type { ListingWithAgent } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventory" };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ListingsPage({ searchParams }: PageProps<"/listings">) {
  const params = await searchParams;
  const { supabase, agent } = await requireAgent();

  const mine = first(params.mine) === "1";
  const locality = first(params.locality) || "";
  const type = first(params.type) || "";
  const min = Number(first(params.min)) || null;
  const max = Number(first(params.max)) || null;
  const beds = Number(first(params.beds)) || null;

  let q = supabase
    .from("listings")
    .select("*, agents(anon_code, verified)")
    .order("created_at", { ascending: false })
    .limit(60);

  if (mine) q = q.eq("agent_id", agent.id);
  else q = q.in("status", ["active", "under_offer"]);
  if (locality) q = q.eq("locality", locality);
  if (type) q = q.eq("property_type", type);
  if (min) q = q.gte("price", min);
  if (max) q = q.lte("price", max);
  if (beds) q = q.gte("bedrooms", beds);

  const { data } = await q;
  const listings = (data ?? []) as ListingWithAgent[];

  return (
    <>
      <PageHeader
        title={mine ? "My listings" : "Network inventory"}
        description={
          mine
            ? "Everything you've uploaded, including drafts and withdrawn stock."
            : "Live stock held by other agencies. Exact locations and identities are hidden until a Deal Room is agreed."
        }
        actions={
          <LinkButton href="/listings/new">
            <Plus className="h-4 w-4" /> New listing
          </LinkButton>
        }
      />

      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium w-fit">
        <Link href="/listings" className={cn("rounded-md px-3 py-1.5", !mine ? "bg-white shadow-sm text-slate-900" : "text-slate-600")}>
          Network
        </Link>
        <Link href="/listings?mine=1" className={cn("rounded-md px-3 py-1.5", mine ? "bg-white shadow-sm text-slate-900" : "text-slate-600")}>
          Mine
        </Link>
      </div>

      <form method="get" className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        {mine && <input type="hidden" name="mine" value="1" />}
        <select name="locality" defaultValue={locality} aria-label="Locality">
          <option value="">Any locality</option>
          {Object.entries(REGIONS).map(([region, towns]) => (
            <optgroup key={region} label={region}>
              {towns.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <select name="type" defaultValue={type} aria-label="Property type">
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input name="min" type="number" placeholder="Min €" defaultValue={min ?? ""} min={0} step={10000} aria-label="Minimum price" />
        <input name="max" type="number" placeholder="Max €" defaultValue={max ?? ""} min={0} step={10000} aria-label="Maximum price" />
        <input name="beds" type="number" placeholder="Min beds" defaultValue={beds ?? ""} min={0} aria-label="Minimum bedrooms" />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" /> Filter
        </Button>
      </form>

      {listings.length === 0 ? (
        <EmptyState
          title={mine ? "You haven't listed anything yet" : "No listings match these filters"}
          description={
            mine
              ? "Upload your stock to make it discoverable by every other agent on the network — anonymously."
              : "Try widening the price range or removing the locality filter. New stock is added by agents every day."
          }
          action={mine ? <LinkButton href="/listings/new">Add your first listing</LinkButton> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} isOwn={l.agent_id === agent.id} />
          ))}
        </div>
      )}
    </>
  );
}
