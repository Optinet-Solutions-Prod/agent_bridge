import type { Metadata } from "next";
import Link from "next/link";
import { AnonBadge, Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { DEAL_STATUS_LABEL } from "@/lib/constants";
import { formatPrice, timeAgo } from "@/lib/format";
import type { Conversation, DealStatus } from "@/lib/types";
import { one } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

type Row = Conversation & {
  listings: { title: string; price: number; currency: string; locality: string } | null;
  buyer: { anon_code: string; verified: boolean } | null;
  lister: { anon_code: string; verified: boolean } | null;
  deal_rooms: { id: string; status: DealStatus } | { id: string; status: DealStatus }[] | null;
  messages: { body: string; sender_id: string; created_at: string }[] | null;
};

export default async function MessagesPage() {
  const { supabase, agent } = await requireAgent();

  const { data } = await supabase
    .from("conversations")
    .select(
      "*, listings(title, price, currency, locality), buyer:agents!buyer_agent_id(anon_code, verified), lister:agents!listing_agent_id(anon_code, verified), deal_rooms(id, status), messages(body, sender_id, created_at)",
    )
    .order("last_message_at", { ascending: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .limit(100);

  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader
        title="Messages"
        description="Anonymous conversations with other agents. Identities are only revealed inside an agreed Deal Room."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Browse the network inventory and message a listing agent, or propose your stock on a buyer request."
          action={<LinkButton href="/listings">Browse inventory</LinkButton>}
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {rows.map((c) => {
            const iAmBuyer = c.buyer_agent_id === agent.id;
            const other = iAmBuyer ? c.lister : c.buyer;
            const deal = one(c.deal_rooms);
            const last = one(c.messages);
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex flex-col gap-2 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {other && <AnonBadge code={other.anon_code} verified={other.verified} prefix={iAmBuyer ? "Listing Agent" : "Buyer Agent"} />}
                      {deal && (
                        <Badge tone={deal.status === "active" ? "green" : deal.status === "proposed" ? "amber" : "neutral"}>
                          Deal Room: {DEAL_STATUS_LABEL[deal.status]}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium text-slate-900">
                      {c.listings?.title ?? "Listing"} · {formatPrice(c.listings?.price, c.listings?.currency)} · {c.listings?.locality}
                    </p>
                    {last && (
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {last.sender_id === agent.id ? "You: " : ""}
                        {last.body}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">{timeAgo(c.last_message_at)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
