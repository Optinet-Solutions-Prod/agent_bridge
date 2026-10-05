import type { Metadata } from "next";
import Link from "next/link";
import { AnonBadge, Badge, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { DEAL_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/format";
import type { DealRoom } from "@/lib/types";

export const metadata: Metadata = { title: "Deal Rooms" };

type Row = DealRoom & {
  listings: { title: string; price: number; currency: string; locality: string } | null;
  buyer: { anon_code: string; verified: boolean } | null;
  lister: { anon_code: string; verified: boolean } | null;
};

const TONE = { proposed: "amber", active: "green", closed: "blue", cancelled: "neutral" } as const;

export default async function DealsPage() {
  const { supabase, agent } = await requireAgent();
  const { data } = await supabase
    .from("deal_rooms")
    .select("*, listings(title, price, currency, locality), buyer:agents!buyer_agent_id(anon_code, verified), lister:agents!listing_agent_id(anon_code, verified)")
    .order("created_at", { ascending: false })
    .limit(100);
  const deals = (data ?? []) as Row[];

  return (
    <>
      <PageHeader
        title="Deal Rooms"
        description="Every introduction with locked-in co-broker terms. Identities and addresses are visible inside agreed rooms."
      />

      {deals.length === 0 ? (
        <EmptyState
          title="No Deal Rooms yet"
          description="When a conversation turns into a real buyer, open a Deal Room from the chat to lock terms and reveal identities."
          action={<LinkButton href="/messages">Go to messages</LinkButton>}
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {deals.map((d) => {
            const iAmBuyer = d.buyer_agent_id === agent.id;
            const other = iAmBuyer ? d.lister : d.buyer;
            const needsMe = d.status === "proposed" && (iAmBuyer ? !d.buyer_agent_accepted_at : !d.listing_agent_accepted_at);
            return (
              <li key={d.id}>
                <Link href={`/deals/${d.id}`} className="flex flex-col gap-2 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={TONE[d.status]}>{DEAL_STATUS_LABEL[d.status]}</Badge>
                      {needsMe && <Badge tone="red">Your acceptance needed</Badge>}
                      {other && <AnonBadge code={other.anon_code} verified={other.verified} prefix={iAmBuyer ? "Listing Agent" : "Buyer Agent"} />}
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium text-slate-900">
                      {d.listings?.title} · {formatPrice(d.sale_price ?? d.listings?.price, d.listings?.currency)} · {d.listings?.locality}
                    </p>
                    <p className="text-xs text-slate-500">
                      {d.buyer_agent_commission_pct}% buyer-agent commission · {d.platform_fee_pct}% platform fee · opened {formatDate(d.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">You are the {iAmBuyer ? "buyer agent" : "listing agent"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
