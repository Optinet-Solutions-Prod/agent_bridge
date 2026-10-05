import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { AnonBadge, Badge, Card, CardBody, CardTitle, LinkButton, PageHeader, Stat } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { PLANS } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { listingsMatchingRequest } from "@/lib/matching";
import type { BuyerRequest, Conversation, DealRoom, ListingWithAgent } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

type ConversationRow = Conversation & {
  listings: { title: string } | null;
  buyer: { anon_code: string; verified: boolean } | null;
  lister: { anon_code: string; verified: boolean } | null;
};

type DealRow = DealRoom & { listings: { title: string; price: number } | null };

export default async function DashboardPage() {
  const { supabase, agent } = await requireAgent();

  const [myListings, myRequests, conversations, deals, network] = await Promise.all([
    supabase.from("listings").select("id, status").eq("agent_id", agent.id),
    supabase.from("buyer_requests").select("*").eq("agent_id", agent.id).eq("status", "active").order("created_at", { ascending: false }).limit(5),
    supabase
      .from("conversations")
      .select("*, listings(title), buyer:agents!buyer_agent_id(anon_code, verified), lister:agents!listing_agent_id(anon_code, verified)")
      .order("last_message_at", { ascending: false })
      .limit(5),
    supabase.from("deal_rooms").select("*, listings(title, price)").order("created_at", { ascending: false }).limit(20),
    supabase
      .from("listings")
      .select("*, agents(anon_code, verified)")
      .neq("agent_id", agent.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const liveListings = (myListings.data ?? []).filter((l) => l.status === "active" || l.status === "under_offer").length;
  const requests = (myRequests.data ?? []) as BuyerRequest[];
  const matchCounts = await Promise.all(
    requests.map(async (r) => (await listingsMatchingRequest(supabase, r, { excludeAgentId: agent.id, limit: 50 })).length),
  );

  const dealRows = (deals.data ?? []) as DealRow[];
  const awaitingMe = dealRows.filter(
    (d) => d.status === "proposed" && (d.buyer_agent_id === agent.id ? !d.buyer_agent_accepted_at : !d.listing_agent_accepted_at),
  );
  const activeDeals = dealRows.filter((d) => d.status === "active").length;
  const limit = PLANS[agent.plan].listingLimit;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          <>
            Welcome back. On the network you are <AnonBadge code={agent.anon_code} verified={agent.verified} />
          </>
        }
        actions={
          <>
            <LinkButton href="/requests/new" variant="secondary">
              <Plus className="h-4 w-4" /> Buyer request
            </LinkButton>
            <LinkButton href="/listings/new">
              <Plus className="h-4 w-4" /> New listing
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Live listings" value={liveListings} hint={limit ? `${limit - liveListings > 0 ? limit - liveListings : 0} left on ${PLANS[agent.plan].name}` : "Unlimited"} />
        <Stat label="Active buyer requests" value={requests.length} />
        <Stat label="Conversations" value={(conversations.data ?? []).length} hint="most recent shown below" />
        <Stat label="Deal Rooms" value={activeDeals} hint={awaitingMe.length ? `${awaitingMe.length} awaiting your acceptance` : "terms agreed"} />
      </div>

      {awaitingMe.length > 0 && (
        <Card className="mt-6 border-amber-300 bg-amber-50/60">
          <CardBody>
            <CardTitle>Deal Rooms waiting for you</CardTitle>
            <ul className="mt-3 divide-y divide-amber-200/60">
              {awaitingMe.map((d) => (
                <li key={d.id}>
                  <Link href={`/deals/${d.id}`} className="flex items-center justify-between py-2 text-sm hover:text-teal-800">
                    <span className="font-medium">{d.listings?.title}</span>
                    <span className="inline-flex items-center gap-1 text-amber-800">
                      Review &amp; accept <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <CardTitle>Matches for your buyers</CardTitle>
              <Link href="/requests?mine=1" className="text-sm text-teal-700 hover:underline">
                All requests
              </Link>
            </div>
            {requests.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Post what your clients are looking for and we&apos;ll match it against every other agency&apos;s stock.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {requests.map((r, i) => (
                  <li key={r.id}>
                    <Link href={`/requests/${r.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-teal-800">
                      <span className="truncate font-medium">{r.title}</span>
                      <Badge tone={matchCounts[i] > 0 ? "green" : "neutral"}>
                        {matchCounts[i]} match{matchCounts[i] === 1 ? "" : "es"}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <CardTitle>Recent conversations</CardTitle>
              <Link href="/messages" className="text-sm text-teal-700 hover:underline">
                All messages
              </Link>
            </div>
            {(conversations.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No conversations yet. Message a listing agent from the inventory.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {((conversations.data ?? []) as ConversationRow[]).map((c) => {
                  const iAmBuyer = c.buyer_agent_id === agent.id;
                  const other = iAmBuyer ? c.lister : c.buyer;
                  return (
                    <li key={c.id}>
                      <Link href={`/messages/${c.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-teal-800">
                        <span className="flex min-w-0 items-center gap-2">
                          {other && <AnonBadge code={other.anon_code} verified={other.verified} prefix={iAmBuyer ? "Listing Agent" : "Buyer Agent"} />}
                          <span className="truncate text-slate-600">{c.listings?.title}</span>
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">{timeAgo(c.last_message_at)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Newest network inventory</h2>
          <Link href="/listings" className="text-sm text-teal-700 hover:underline">
            Browse all
          </Link>
        </div>
        {(network.data ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No other agencies have listed stock yet. Invite colleagues — the network is only as good as the inventory in it.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {((network.data ?? []) as ListingWithAgent[]).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
