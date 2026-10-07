import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Flame, Handshake, MessageSquare, Plus, Users } from "lucide-react";
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

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Malta" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

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
  const conversationRows = (conversations.data ?? []) as ConversationRow[];
  const networkRows = (network.data ?? []) as ListingWithAgent[];

  return (
    <>
      <PageHeader
        eyebrow={greeting()}
        title="Your network at a glance"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Other agents see you as <AnonBadge code={agent.anon_code} verified={agent.verified} />
          </span>
        }
        actions={
          <>
            <LinkButton href="/requests/new" variant="secondary">
              <Plus className="h-4 w-4" /> Buyer brief
            </LinkButton>
            <LinkButton href="/listings/new">
              <Plus className="h-4 w-4" /> New listing
            </LinkButton>
          </>
        }
      />

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/discover"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 p-5 text-white shadow-lg shadow-teal-900/20 transition hover:shadow-xl hover:shadow-teal-900/30"
        >
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Flame className="h-5 w-5" />
          </span>
          <p className="mt-5 text-lg font-semibold">Swipe matches</p>
          <p className="mt-0.5 text-sm text-teal-100/80">Set a client brief, swipe right on anything worth a viewing.</p>
          <ArrowRight className="absolute right-5 top-5 h-5 w-5 opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100" />
        </Link>
        <Link href="/listings/new" className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <Building2 className="h-5 w-5" />
          </span>
          <p className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-teal-800">Add a listing</p>
          <p className="mt-0.5 text-sm text-slate-500">Share stock anonymously with every agency on the network.</p>
        </Link>
        <Link href="/requests/new" className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <Users className="h-5 w-5" />
          </span>
          <p className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-teal-800">Post a buyer brief</p>
          <p className="mt-0.5 text-sm text-slate-500">Describe what your client wants; the network surfaces matching stock.</p>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Building2}
          label="Live listings"
          value={liveListings}
          hint={limit ? `${Math.max(limit - liveListings, 0)} left on ${PLANS[agent.plan].name}` : "Unlimited on your plan"}
        />
        <Stat icon={Users} tone="teal" label="Active buyer briefs" value={requests.length} hint={requests.length ? `${matchCounts.reduce((a, b) => a + b, 0)} matching properties` : "Post one to start matching"} />
        <Stat icon={MessageSquare} label="Conversations" value={conversationRows.length} hint="most recent shown below" />
        <Stat
          icon={Handshake}
          tone={awaitingMe.length ? "amber" : "neutral"}
          label="Deal Rooms"
          value={activeDeals}
          hint={awaitingMe.length ? `${awaitingMe.length} awaiting your acceptance` : "terms agreed"}
        />
      </div>

      {awaitingMe.length > 0 && (
        <Card className="mt-6 border-amber-300 bg-amber-50/70">
          <CardBody>
            <CardTitle>Deal Rooms waiting for you</CardTitle>
            <ul className="mt-3 divide-y divide-amber-200/60">
              {awaitingMe.map((d) => (
                <li key={d.id}>
                  <Link href={`/deals/${d.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-teal-800">
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
              <Link href="/requests?mine=1" className="text-sm font-medium text-teal-700 hover:underline">
                All briefs
              </Link>
            </div>
            {requests.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Post what your clients are looking for and we&apos;ll match it against every other agency&apos;s stock.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {requests.map((r, i) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <Link href={`/requests/${r.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-teal-800">
                      {r.title}
                    </Link>
                    <Badge tone={matchCounts[i] > 0 ? "green" : "neutral"}>
                      {matchCounts[i]} match{matchCounts[i] === 1 ? "" : "es"}
                    </Badge>
                    <Link
                      href={`/discover?request=${r.id}`}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-teal-50 px-2.5 text-xs font-medium text-teal-800 hover:bg-teal-100"
                    >
                      <Flame className="h-3.5 w-3.5" /> Swipe
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
              <Link href="/messages" className="text-sm font-medium text-teal-700 hover:underline">
                All messages
              </Link>
            </div>
            {conversationRows.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No conversations yet. Message a listing agent from the inventory or your shortlist.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {conversationRows.map((c) => {
                  const iAmBuyer = c.buyer_agent_id === agent.id;
                  const other = iAmBuyer ? c.lister : c.buyer;
                  return (
                    <li key={c.id}>
                      <Link href={`/messages/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-teal-800">
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
          <h2 className="text-lg font-semibold tracking-tight">Newest network inventory</h2>
          <Link href="/listings" className="text-sm font-medium text-teal-700 hover:underline">
            Browse all
          </Link>
        </div>
        {networkRows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
            No other agencies have listed stock yet. Invite colleagues — the network is only as good as the inventory in it.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {networkRows.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
