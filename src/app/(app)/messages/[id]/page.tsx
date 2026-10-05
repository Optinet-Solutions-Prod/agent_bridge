import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Handshake } from "lucide-react";
import { Chat } from "@/components/chat";
import { AnonBadge, Badge, Card, CardBody, CardTitle, LinkButton } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { DEAL_STATUS_LABEL } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { Conversation, DealStatus, Listing, Message } from "@/lib/types";
import { one } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversation" };

type Row = Conversation & {
  listings: Listing | null;
  buyer: { anon_code: string; verified: boolean } | null;
  lister: { anon_code: string; verified: boolean } | null;
  deal_rooms: { id: string; status: DealStatus } | { id: string; status: DealStatus }[] | null;
};

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const { supabase, agent } = await requireAgent();

  const [{ data }, { data: messages }] = await Promise.all([
    supabase
      .from("conversations")
      .select("*, listings(*), buyer:agents!buyer_agent_id(anon_code, verified), lister:agents!listing_agent_id(anon_code, verified), deal_rooms(id, status)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }).limit(500),
  ]);
  if (!data) notFound();

  const conversation = data as Row;
  const iAmBuyer = conversation.buyer_agent_id === agent.id;
  const other = iAmBuyer ? conversation.lister : conversation.buyer;
  const otherLabel = `${iAmBuyer ? "Listing Agent" : "Buyer Agent"} #${other?.anon_code ?? "?"}`;
  const listing = conversation.listings;
  const deal = one(conversation.deal_rooms);

  return (
    <>
      <Link href="/messages" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> All messages
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {other && <AnonBadge code={other.anon_code} verified={other.verified} prefix={iAmBuyer ? "Listing Agent" : "Buyer Agent"} />}
              <span className="text-sm text-slate-500">about</span>
              {listing && (
                <Link href={`/listings/${listing.id}`} className="text-sm font-medium text-teal-800 hover:underline">
                  {listing.title}
                </Link>
              )}
            </div>
          </div>
          <Chat conversationId={conversation.id} meId={agent.id} counterpartyLabel={otherLabel} initialMessages={(messages ?? []) as Message[]} />
        </div>

        <div className="space-y-4">
          {listing && (
            <Card>
              <CardBody>
                <CardTitle>{listing.title}</CardTitle>
                <p className="mt-1 text-xl font-semibold">{formatPrice(listing.price, listing.currency)}</p>
                <p className="text-sm text-slate-600">
                  {listing.property_type} · {listing.locality}
                  {listing.bedrooms != null ? ` · ${listing.bedrooms} bed` : ""}
                </p>
                <Badge tone="teal" className="mt-3">
                  {listing.buyer_agent_commission_pct}% to buyer agent
                </Badge>
              </CardBody>
            </Card>
          )}

          <Card className={deal ? "" : "border-teal-200 bg-teal-50/50"}>
            <CardBody>
              <div className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-teal-700" />
                <CardTitle>Deal Room</CardTitle>
              </div>
              {deal ? (
                <>
                  <Badge tone={deal.status === "active" ? "green" : deal.status === "proposed" ? "amber" : "neutral"} className="mt-3">
                    {DEAL_STATUS_LABEL[deal.status]}
                  </Badge>
                  <LinkButton href={`/deals/${deal.id}`} className="mt-4 w-full" variant="secondary">
                    Open Deal Room
                  </LinkButton>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-slate-600">
                    {iAmBuyer
                      ? "Have a serious buyer? Lock in the co-broker terms. Once both sides accept, the address, viewing details and identities are revealed."
                      : "Ready to work with this buyer agent? Lock in the co-broker terms. Once both sides accept, identities are revealed."}
                  </p>
                  <LinkButton href={`/deals/new?conversation=${conversation.id}`} className="mt-4 w-full">
                    Start Deal Room
                  </LinkButton>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
