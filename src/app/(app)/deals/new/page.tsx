import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { OpenDealRoomForm } from "@/components/deal-forms";
import { DealEconomics, DealTerms } from "@/components/deal-terms";
import { AnonBadge, Card, CardBody, CardTitle, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { CO_BROKER_TERMS_VERSION, PLATFORM_FEE_PCT } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { Conversation, Listing } from "@/lib/types";
import { one } from "@/lib/utils";

export const metadata: Metadata = { title: "Start Deal Room" };

type Row = Conversation & {
  listings: Listing | null;
  buyer: { anon_code: string; verified: boolean } | null;
  lister: { anon_code: string; verified: boolean } | null;
  deal_rooms: { id: string } | { id: string }[] | null;
};

export default async function NewDealRoomPage({ searchParams }: PageProps<"/deals/new">) {
  const { conversation: conversationId } = await searchParams;
  if (typeof conversationId !== "string") notFound();

  const { supabase, agent } = await requireAgent();
  const { data } = await supabase
    .from("conversations")
    .select("*, listings(*), buyer:agents!buyer_agent_id(anon_code, verified), lister:agents!listing_agent_id(anon_code, verified), deal_rooms(id)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!data) notFound();

  const conversation = data as Row;
  const existingDeal = one(conversation.deal_rooms);
  if (existingDeal) redirect(`/deals/${existingDeal.id}`);

  const listing = conversation.listings;
  if (!listing) notFound();
  const iAmBuyer = conversation.buyer_agent_id === agent.id;
  const other = iAmBuyer ? conversation.lister : conversation.buyer;

  return (
    <>
      <Link href={`/messages/${conversation.id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to conversation
      </Link>
      <PageHeader
        title="Start a Deal Room"
        description="Lock in the commercial terms first. Identities and the exact location are revealed only after both agents accept."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody>
              <CardTitle>Co-broker terms ({CO_BROKER_TERMS_VERSION})</CardTitle>
              <div className="mt-3">
                <DealTerms />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>Your acceptance</CardTitle>
              <p className="mt-1 mb-4 text-sm text-slate-600">
                Opening the Deal Room counts as your acceptance. {other ? `${iAmBuyer ? "Listing Agent" : "Buyer Agent"} #${other.anon_code}` : "The other agent"} will be
                asked to accept the same terms.
              </p>
              <OpenDealRoomForm conversationId={conversation.id} iAmBuyer={iAmBuyer} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardBody>
              <CardTitle>{listing.title}</CardTitle>
              <p className="mt-1 text-xl font-semibold">{formatPrice(listing.price, listing.currency)}</p>
              <p className="text-sm text-slate-600">
                {listing.property_type} · {listing.locality}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {conversation.lister && <AnonBadge code={conversation.lister.anon_code} verified={conversation.lister.verified} prefix="Listing Agent" />}
                {conversation.buyer && <AnonBadge code={conversation.buyer.anon_code} verified={conversation.buyer.verified} prefix="Buyer Agent" />}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>Economics</CardTitle>
              <div className="mt-3">
                <DealEconomics price={listing.price} commissionPct={listing.buyer_agent_commission_pct} platformFeePct={PLATFORM_FEE_PCT} />
              </div>
            </CardBody>
          </Card>
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            Nothing is revealed yet. The other agent sees only your anonymous ID until they accept too.
          </div>
        </div>
      </div>
    </>
  );
}
