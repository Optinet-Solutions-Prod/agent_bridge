import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { RequestCard } from "@/components/request-card";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import type { BuyerRequestWithAgent } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Buyer requests" };

export default async function RequestsPage({ searchParams }: PageProps<"/requests">) {
  const params = await searchParams;
  const { supabase, agent } = await requireAgent();
  const mine = params.mine === "1";

  let q = supabase.from("buyer_requests").select("*, agents(anon_code, verified)").order("created_at", { ascending: false }).limit(60);
  if (mine) q = q.eq("agent_id", agent.id);
  else q = q.eq("status", "active");

  const { data } = await q;
  const requests = (data ?? []) as BuyerRequestWithAgent[];

  return (
    <>
      <PageHeader
        title={mine ? "My buyer requests" : "Buyer demand"}
        description={
          mine
            ? "Briefs you've posted on behalf of your clients."
            : "What other agents' clients are looking for right now. If you hold matching stock, propose it anonymously."
        }
        actions={
          <LinkButton href="/requests/new">
            <Plus className="h-4 w-4" /> Post a buyer request
          </LinkButton>
        }
      />

      <div className="mb-6 flex w-fit gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <Link href="/requests" className={cn("rounded-md px-3 py-1.5", !mine ? "bg-white text-slate-900 shadow-sm" : "text-slate-600")}>
          Network
        </Link>
        <Link href="/requests?mine=1" className={cn("rounded-md px-3 py-1.5", mine ? "bg-white text-slate-900 shadow-sm" : "text-slate-600")}>
          Mine
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title={mine ? "No buyer requests yet" : "No active buyer requests"}
          description={
            mine
              ? "Post what your client is looking for and the network will surface matching stock — without revealing who holds it."
              : "Check back soon, or post your own buyer request."
          }
          action={<LinkButton href="/requests/new">Post a buyer request</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} isOwn={r.agent_id === agent.id} />
          ))}
        </div>
      )}
    </>
  );
}
