import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock, Lock, LockOpen, Mail, MapPin, Phone, User } from "lucide-react";
import { cancelDealRoom } from "@/app/(app)/deals/actions";
import { AcceptDealRoomForm, CloseDealRoomForm } from "@/components/deal-forms";
import { DealEconomics, DealTerms } from "@/components/deal-terms";
import { AnonBadge, Badge, Button, Card, CardBody, CardTitle, DescriptionList, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { DEAL_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { AgentIdentity, DealRoom, Listing, ListingPrivate } from "@/lib/types";

export const metadata: Metadata = { title: "Deal Room" };

type Row = DealRoom & {
  listings: Listing | null;
  buyer: { anon_code: string; verified: boolean } | null;
  lister: { anon_code: string; verified: boolean } | null;
};

const TONE = { proposed: "amber", active: "green", closed: "blue", cancelled: "neutral" } as const;

export default async function DealRoomPage({ params }: PageProps<"/deals/[id]">) {
  const { id } = await params;
  const { supabase, agent } = await requireAgent();

  const { data } = await supabase
    .from("deal_rooms")
    .select("*, listings(*), buyer:agents!buyer_agent_id(anon_code, verified), lister:agents!listing_agent_id(anon_code, verified)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const deal = data as Row;
  const listing = deal.listings;
  const iAmBuyer = deal.buyer_agent_id === agent.id;
  const counterpartyId = iAmBuyer ? deal.listing_agent_id : deal.buyer_agent_id;
  const other = iAmBuyer ? deal.lister : deal.buyer;
  const revealed = deal.status === "active" || deal.status === "closed";
  const myAcceptedAt = iAmBuyer ? deal.buyer_agent_accepted_at : deal.listing_agent_accepted_at;
  const theirAcceptedAt = iAmBuyer ? deal.listing_agent_accepted_at : deal.buyer_agent_accepted_at;

  // These two queries return rows only when RLS allows it (i.e. terms agreed by both).
  const [{ data: identity }, { data: privateRow }] = revealed
    ? await Promise.all([
        supabase.from("agent_identities").select("*").eq("agent_id", counterpartyId).maybeSingle(),
        supabase.from("listing_private").select("*").eq("listing_id", deal.listing_id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];
  const counterparty = identity as AgentIdentity | null;
  const privateDetails = privateRow as ListingPrivate | null;

  return (
    <>
      <Link href={`/messages/${deal.conversation_id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to conversation
      </Link>
      <PageHeader
        title={`Deal Room · ${listing?.title ?? "Listing"}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={TONE[deal.status]}>{DEAL_STATUS_LABEL[deal.status]}</Badge>
            {other && <AnonBadge code={other.anon_code} verified={other.verified} prefix={iAmBuyer ? "Listing Agent" : "Buyer Agent"} />}
            <span>You are the {iAmBuyer ? "buyer agent" : "listing agent"}.</span>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Reveal panel */}
          {revealed ? (
            <Card className="border-emerald-300">
              <CardBody>
                <div className="flex items-center gap-2">
                  <LockOpen className="h-5 w-5 text-emerald-700" />
                  <CardTitle>Terms agreed — details revealed {formatDateTime(deal.revealed_at)}</CardTitle>
                </div>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{iAmBuyer ? "Listing agent" : "Buyer agent"}</p>
                    {counterparty ? (
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-800">
                        <li className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" /> {counterparty.full_name || "—"}
                          {counterparty.agency_name ? <span className="text-slate-500">· {counterparty.agency_name}</span> : null}
                        </li>
                        <li className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          {counterparty.phone ? <a href={`tel:${counterparty.phone}`} className="hover:underline">{counterparty.phone}</a> : "—"}
                        </li>
                        <li className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {counterparty.email ? <a href={`mailto:${counterparty.email}`} className="hover:underline">{counterparty.email}</a> : "—"}
                        </li>
                        {counterparty.license_no && <li className="text-xs text-slate-500">Licence {counterparty.license_no}</li>}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">Not available.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Exact location</p>
                    {privateDetails ? (
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-800">
                        <li className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                          <span>
                            {[privateDetails.block_or_building, privateDetails.address_line, privateDetails.street].filter(Boolean).join(", ") ||
                              "No address entered by the listing agent."}
                            {listing ? `, ${listing.locality}` : ""}
                          </span>
                        </li>
                        {privateDetails.viewing_notes && (
                          <li className="text-sm text-slate-700">
                            <span className="font-medium">Viewings:</span> {privateDetails.viewing_notes}
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No private details recorded.</p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="border-slate-300 bg-slate-50">
              <CardBody className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-900">
                    {deal.status === "cancelled" ? "This Deal Room was cancelled before terms were agreed." : "Waiting for both sides to accept"}
                  </p>
                  {deal.status === "proposed" && (
                    <p className="mt-1">Names, contact details and the exact address unlock the moment the second acceptance lands.</p>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Acceptance status */}
          <Card>
            <CardBody>
              <CardTitle>Acceptance</CardTitle>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  {myAcceptedAt ? <Check className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-amber-600" />}
                  You {myAcceptedAt ? `accepted ${formatDateTime(myAcceptedAt)}` : "have not accepted yet"}
                </li>
                <li className="flex items-center gap-2">
                  {theirAcceptedAt ? <Check className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-amber-600" />}
                  {other ? `#${other.anon_code}` : "Counterparty"} {theirAcceptedAt ? `accepted ${formatDateTime(theirAcceptedAt)}` : "has not accepted yet"}
                </li>
                {deal.closed_at && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-sky-600" /> Closed {formatDateTime(deal.closed_at)} at {formatPrice(deal.sale_price)}
                  </li>
                )}
              </ul>
              {deal.buyer_brief && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Note from {deal.proposed_by === agent.id ? "you" : "the proposer"}</p>
                  <p className="mt-1 whitespace-pre-line">{deal.buyer_brief}</p>
                </div>
              )}

              {deal.status === "proposed" && !myAcceptedAt && (
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <AcceptDealRoomForm dealId={deal.id} />
                </div>
              )}
              {deal.status === "proposed" && (
                <form action={cancelDealRoom.bind(null, deal.id)} className="mt-3">
                  <Button type="submit" variant="ghost" size="sm" className="text-slate-500">
                    Cancel Deal Room
                  </Button>
                </form>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Co-broker terms ({deal.terms_version})</CardTitle>
              <div className="mt-3">
                <DealTerms />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          {listing && (
            <Card>
              <CardBody>
                <Link href={`/listings/${listing.id}`} className="font-semibold hover:text-teal-800">
                  {listing.title}
                </Link>
                <p className="mt-1 text-xl font-semibold">{formatPrice(listing.price, listing.currency)}</p>
                <p className="text-sm text-slate-600">
                  {listing.property_type} · {listing.locality}
                </p>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardBody>
              <CardTitle>Economics</CardTitle>
              <div className="mt-3">
                <DealEconomics
                  price={deal.sale_price ?? listing?.price ?? 0}
                  commissionPct={deal.buyer_agent_commission_pct}
                  platformFeePct={deal.platform_fee_pct}
                  label={deal.sale_price ? "Final sale price" : "Based on the asking price"}
                />
              </div>
            </CardBody>
          </Card>
          {deal.status === "active" && !iAmBuyer && listing && (
            <Card>
              <CardBody>
                <CardTitle>Close the deal</CardTitle>
                <p className="mt-1 mb-3 text-sm text-slate-600">Once the sale completes, record the final price. The listing is marked as sold.</p>
                <CloseDealRoomForm dealId={deal.id} askingPrice={listing.price} />
              </CardBody>
            </Card>
          )}
          <Card>
            <CardBody>
              <DescriptionList
                items={[
                  { label: "Opened", value: formatDateTime(deal.created_at) },
                  { label: "Proposed by", value: deal.proposed_by === agent.id ? "You" : `#${other?.anon_code ?? "?"}` },
                  { label: "Platform fee", value: `${deal.platform_fee_pct}% per side` },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
