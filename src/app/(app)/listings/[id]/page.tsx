import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, BedDouble, EyeOff, Lock, LockOpen, MessageSquare, Pencil, Ruler, Trees } from "lucide-react";
import { deleteListing, setListingStatus, startConversation } from "@/app/(app)/listings/actions";
import { SubmitButton } from "@/components/submit-button";
import { AnonBadge, Badge, Button, Card, CardBody, CardTitle, DescriptionList, LinkButton, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { LISTING_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatNumber, formatPrice, timeAgo } from "@/lib/format";
import { requestsMatchingListing } from "@/lib/matching";
import type { Conversation, ListingPrivate, ListingWithAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Listing" };

export default async function ListingDetailPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const { supabase, agent } = await requireAgent();

  const { data } = await supabase.from("listings").select("*, agents(anon_code, verified)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const listing = data as ListingWithAgent;
  const isOwner = listing.agent_id === agent.id;

  // RLS returns this row only to the owner or to the counterparty of an agreed Deal Room.
  const [{ data: privateRow }, conversationsRes, matchingRequests] = await Promise.all([
    supabase.from("listing_private").select("*").eq("listing_id", id).maybeSingle(),
    isOwner
      ? supabase
          .from("conversations")
          .select("*, agents:agents!buyer_agent_id(anon_code, verified)")
          .eq("listing_id", id)
          .order("last_message_at", { ascending: false })
      : Promise.resolve({ data: null }),
    isOwner ? requestsMatchingListing(supabase, listing, { excludeAgentId: agent.id, limit: 6 }) : Promise.resolve([]),
  ]);
  const privateDetails = privateRow as ListingPrivate | null;
  const conversations = (conversationsRes.data ?? []) as (Conversation & { agents: { anon_code: string; verified: boolean } | null })[];

  const startChat = startConversation.bind(null, listing.id, null);

  return (
    <>
      <PageHeader
        title={listing.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {listing.property_type} · {listing.locality}
            {listing.region ? `, ${listing.region}` : ""} · listed {formatDate(listing.created_at)}
            <Badge tone={listing.status === "active" ? "green" : "amber"}>{LISTING_STATUS_LABEL[listing.status]}</Badge>
            {isOwner && <Badge tone="blue">Your listing</Badge>}
          </span>
        }
        actions={
          isOwner ? (
            <>
              <LinkButton href={`/listings/${listing.id}/edit`} variant="secondary">
                <Pencil className="h-4 w-4" /> Edit
              </LinkButton>
              {listing.status === "active" ? (
                <form action={setListingStatus.bind(null, listing.id, "withdrawn")}>
                  <Button type="submit" variant="ghost">
                    Withdraw
                  </Button>
                </form>
              ) : listing.status !== "sold" ? (
                <form action={setListingStatus.bind(null, listing.id, "active")}>
                  <Button type="submit" variant="ghost">
                    Set live
                  </Button>
                </form>
              ) : null}
            </>
          ) : (
            <form action={startChat}>
              <SubmitButton pendingText="Opening chat…">
                <MessageSquare className="h-4 w-4" /> Message listing agent
              </SubmitButton>
            </form>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Photos */}
          {listing.photo_urls.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {listing.photo_urls.map((url, i) => (
                <div key={url} className={`relative overflow-hidden rounded-xl bg-slate-100 ${i === 0 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-[4/3]"}`}>
                  <Image src={url} alt="" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" priority={i === 0} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid aspect-[21/9] place-items-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
              No photos yet
            </div>
          )}

          <Card>
            <CardBody>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-3xl font-semibold">{formatPrice(listing.price, listing.currency)}</p>
                <Badge tone="teal">{listing.buyer_agent_commission_pct}% commission to buyer agent</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
                {listing.bedrooms != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <BedDouble className="h-4 w-4 text-slate-400" /> {listing.bedrooms} bedrooms
                  </span>
                )}
                {listing.bathrooms != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Bath className="h-4 w-4 text-slate-400" /> {listing.bathrooms} bathrooms
                  </span>
                )}
                {listing.size_sqm != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Ruler className="h-4 w-4 text-slate-400" /> {formatNumber(listing.size_sqm, " m²")} internal
                  </span>
                )}
                {listing.outdoor_sqm != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Trees className="h-4 w-4 text-slate-400" /> {formatNumber(listing.outdoor_sqm, " m²")} outdoor
                  </span>
                )}
              </div>
              {listing.features.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {listing.features.map((f) => (
                    <li key={f} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700">
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              {listing.description && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{listing.description}</p>}
            </CardBody>
          </Card>

          {/* Private panel */}
          {privateDetails ? (
            <Card className={isOwner ? "border-amber-200" : "border-emerald-300"}>
              <CardBody>
                <div className="flex items-center gap-2">
                  {isOwner ? <EyeOff className="h-5 w-5 text-amber-700" /> : <LockOpen className="h-5 w-5 text-emerald-700" />}
                  <CardTitle>{isOwner ? "Private details — only you can see these" : "Exact location — unlocked by your Deal Room"}</CardTitle>
                </div>
                <DescriptionList
                  items={[
                    { label: "Address", value: privateDetails.address_line || "—" },
                    { label: "Street", value: privateDetails.street || "—" },
                    { label: "Block / building", value: privateDetails.block_or_building || "—" },
                    { label: "Viewing arrangements", value: privateDetails.viewing_notes || "—" },
                    ...(isOwner ? [{ label: "Internal notes", value: privateDetails.internal_notes || "—" }] : []),
                  ]}
                />
              </CardBody>
            </Card>
          ) : (
            !isOwner && (
              <Card className="border-slate-300 bg-slate-50">
                <CardBody className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-900">Exact location and agent identity are locked</p>
                    <p className="mt-1">
                      Message the listing agent anonymously. When you have a serious buyer, open a Deal Room: once both of you accept the
                      co-broker terms, the address, viewing details and contact information are revealed here.
                    </p>
                  </div>
                </CardBody>
              </Card>
            )
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody>
              <CardTitle>Listing agent</CardTitle>
              <div className="mt-3">
                {listing.agents && <AnonBadge code={listing.agents.anon_code} verified={listing.agents.verified} prefix="Listing Agent" />}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {isOwner ? "This is how other agents see you." : "Name, agency and contact details are revealed inside an agreed Deal Room."}
              </p>
            </CardBody>
          </Card>

          {isOwner && (
            <>
              <Card>
                <CardBody>
                  <CardTitle>Enquiries</CardTitle>
                  {conversations.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No agent has messaged you about this listing yet.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-slate-100">
                      {conversations.map((c) => (
                        <li key={c.id}>
                          <Link href={`/messages/${c.id}`} className="flex items-center justify-between py-2 text-sm hover:text-teal-800">
                            {c.agents && <AnonBadge code={c.agents.anon_code} verified={c.agents.verified} prefix="Buyer Agent" />}
                            <span className="text-xs text-slate-500">{timeAgo(c.last_message_at)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <CardTitle>Buyers looking for this</CardTitle>
                  {matchingRequests.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No active buyer requests match this listing right now.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-slate-100">
                      {matchingRequests.map((r) => (
                        <li key={r.id}>
                          <Link href={`/requests/${r.id}`} className="block py-2 text-sm hover:text-teal-800">
                            <p className="font-medium">{r.title}</p>
                            <p className="text-xs text-slate-500">
                              {r.agents ? `Agent #${r.agents.anon_code}` : ""} · up to {formatPrice(r.max_price)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <form action={deleteListing.bind(null, listing.id)}>
                <Button type="submit" variant="ghost" className="w-full text-red-600 hover:bg-red-50">
                  Delete listing
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
