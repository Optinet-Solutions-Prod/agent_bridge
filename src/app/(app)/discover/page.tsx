import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Heart, MessageSquare, RotateCcw, SlidersHorizontal, Trash2 } from "lucide-react";
import { startConversation } from "@/app/(app)/listings/actions";
import { removeFromShortlist, resetPasses } from "@/app/(app)/discover/actions";
import { DiscoverBrief } from "@/components/discover-brief";
import { ListingCard } from "@/components/listing-card";
import { SubmitButton } from "@/components/submit-button";
import { SwipeDeck } from "@/components/swipe-deck";
import { Button, Card, CardBody, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireAgent } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { listingsMatchingRequest } from "@/lib/matching";
import type { BuyerRequest, ListingWithAgent, MatchCriteria, SwipeDecision } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Swipe matches" };

type Param = string | string[] | undefined;

/** Repeatable param. `undefined` = not supplied (fall back to the brief); `loc=` (empty) = "any". */
function list(v: Param): string[] | undefined {
  if (v === undefined) return undefined;
  return (Array.isArray(v) ? v : [v]).map((s) => s.trim()).filter(Boolean);
}

/** Numeric param. `undefined` = not supplied; empty or invalid = null ("no limit"). */
function numParam(v: Param): number | null | undefined {
  if (v === undefined) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<Record<string, Param>> }) {
  const params = await searchParams;
  const { supabase, agent } = await requireAgent();

  const { data: requestRows } = await supabase
    .from("buyer_requests")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const requests = (requestRows ?? []) as BuyerRequest[];

  // Default to the newest brief; `request=none` means an ad-hoc quick brief.
  const requestParam = typeof params.request === "string" ? params.request : undefined;
  const selected =
    requestParam === "none" ? null : (requests.find((r) => r.id === requestParam) ?? (requestParam ? null : (requests[0] ?? null)));

  const loc = list(params.loc);
  const type = list(params.type);
  const min = numParam(params.min);
  const max = numParam(params.max);
  const beds = numParam(params.beds);

  const criteria: MatchCriteria = {
    localities: loc ?? selected?.localities ?? [],
    property_types: type ?? selected?.property_types ?? [],
    min_price: min !== undefined ? min : (selected?.min_price ?? null),
    max_price: max !== undefined ? max : (selected?.max_price ?? null),
    min_bedrooms: beds !== undefined ? beds : (selected?.min_bedrooms ?? null),
    min_size_sqm: selected?.min_size_sqm ?? null,
    must_have_features: selected?.must_have_features ?? [],
  };
  const tab = params.tab === "shortlist" ? "shortlist" : "swipe";
  const requestId = selected?.id ?? null;

  let swipesQ = supabase
    .from("listing_swipes")
    .select("listing_id, decision")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false });
  swipesQ = requestId ? swipesQ.eq("buyer_request_id", requestId) : swipesQ.is("buyer_request_id", null);
  const swipesRes = await swipesQ;
  const needsMigration =
    !!swipesRes.error && (swipesRes.error.code === "PGRST205" || swipesRes.error.code === "42P01" || /listing_swipes/.test(swipesRes.error.message));
  const swipes = (swipesRes.data ?? []) as { listing_id: string; decision: SwipeDecision }[];
  const seenIds = swipes.map((s) => s.listing_id);
  const likedIds = swipes.filter((s) => s.decision === "like").map((s) => s.listing_id);
  const passedCount = seenIds.length - likedIds.length;

  const [deck, shortlistRows] = await Promise.all([
    tab === "swipe" ? listingsMatchingRequest(supabase, criteria, { excludeAgentId: agent.id, excludeIds: seenIds, limit: 40 }) : Promise.resolve([]),
    tab === "shortlist" && likedIds.length
      ? supabase
          .from("listings")
          .select("*, agents(anon_code, verified)")
          .in("id", likedIds)
          .then((r) => (r.data ?? []) as ListingWithAgent[])
      : Promise.resolve([] as ListingWithAgent[]),
  ]);
  // Keep the shortlist in "most recently liked first" order.
  const shortlist = likedIds.map((id) => shortlistRows.find((l) => l.id === id)).filter((l): l is ListingWithAgent => !!l);

  // Preserve the current brief in links between tabs.
  const base = new URLSearchParams();
  base.set("request", requestId ?? "none");
  if (loc !== undefined) (loc.length ? loc : [""]).forEach((l) => base.append("loc", l));
  if (type !== undefined) (type.length ? type : [""]).forEach((t) => base.append("type", t));
  if (min !== undefined) base.set("min", min === null ? "" : String(min));
  if (max !== undefined) base.set("max", max === null ? "" : String(max));
  if (beds !== undefined) base.set("beds", beds === null ? "" : String(beds));
  const href = (overrides: Record<string, string | null>) => {
    const p = new URLSearchParams(base);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    return `/discover?${p.toString()}`;
  };
  const widerMax = criteria.max_price ? Math.ceil((criteria.max_price * 1.2) / 10000) * 10000 : null;
  const deckKey = `${requestId ?? "none"}:${JSON.stringify(criteria)}`;

  return (
    <>
      <PageHeader
        eyebrow="Match"
        title="Swipe through the network's stock"
        description="Set your client's brief, then swipe right on anything worth a viewing. Likes build a shortlist you can message from — still anonymously."
      />

      {needsMigration && (
        <Card className="mb-6 border-amber-300 bg-amber-50/80">
          <CardBody className="text-sm text-amber-900">
            <p className="font-semibold">One database step is missing.</p>
            <p className="mt-1">
              Swipes can&apos;t be saved yet. In Supabase open <strong>SQL Editor</strong>, paste the contents of{" "}
              <code className="rounded bg-amber-100 px-1">supabase/migrations/0002_swipes.sql</code> and run it. Then reload this page.
            </p>
          </CardBody>
        </Card>
      )}

      <DiscoverBrief key={deckKey} requests={requests.map((r) => ({ id: r.id, title: r.title }))} selectedId={requestId} criteria={criteria} />

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex w-fit gap-1 rounded-xl bg-slate-200/60 p-1 text-sm font-medium">
          <Link
            href={href({ tab: null })}
            className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition", tab === "swipe" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            <Flame className="h-4 w-4" /> Swipe
          </Link>
          <Link
            href={href({ tab: "shortlist" })}
            className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition", tab === "shortlist" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            <Heart className="h-4 w-4" /> Shortlist
            {likedIds.length > 0 && (
              <span className={cn("rounded-full px-1.5 text-[11px]", tab === "shortlist" ? "bg-teal-700 text-white" : "bg-slate-300/70 text-slate-700")}>{likedIds.length}</span>
            )}
          </Link>
        </div>
        {passedCount > 0 && tab === "swipe" && (
          <form action={resetPasses.bind(null, requestId)}>
            <Button type="submit" variant="ghost" size="sm">
              <RotateCcw className="h-3.5 w-3.5" /> Bring back {passedCount} passed
            </Button>
          </form>
        )}
      </div>

      {tab === "swipe" ? (
        deck.length > 0 ? (
          <SwipeDeck key={deckKey} listings={deck} requestId={requestId} likedCount={likedIds.length} shortlistHref={href({ tab: "shortlist" })} />
        ) : (
          <EmptyState
            icon={SlidersHorizontal}
            title={seenIds.length ? "You've seen everything that matches this brief" : "Nothing matches this brief yet"}
            description={
              seenIds.length
                ? "Widen the budget or the localities to see more, bring back the ones you passed on, or message the agents on your shortlist."
                : "Try a wider price range, more localities, or fewer must-have features. New stock is added by agents every day."
            }
            action={
              <>
                {widerMax && (
                  <LinkButton href={href({ max: String(widerMax), tab: null })} variant="secondary">
                    Raise budget to {formatPrice(widerMax)}
                  </LinkButton>
                )}
                {likedIds.length > 0 && (
                  <LinkButton href={href({ tab: "shortlist" })}>
                    <Heart className="h-4 w-4" /> View shortlist ({likedIds.length})
                  </LinkButton>
                )}
              </>
            }
          />
        )
      ) : shortlist.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No properties shortlisted for this brief yet"
          description="Swipe right on a property to add it here. From the shortlist you can message each listing agent in one tap."
          action={
            <LinkButton href={href({ tab: null })}>
              <Flame className="h-4 w-4" /> Start swiping
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shortlist.map((l) => (
            <div key={l.id} className="flex flex-col gap-2">
              <ListingCard listing={l} />
              <div className="flex gap-2">
                <form action={startConversation.bind(null, l.id, requestId)} className="flex-1">
                  <SubmitButton size="sm" className="w-full" pendingText="Opening chat…">
                    <MessageSquare className="h-4 w-4" /> Message listing agent
                  </SubmitButton>
                </form>
                <form action={removeFromShortlist.bind(null, l.id, requestId)}>
                  <Button type="submit" variant="secondary" size="sm" aria-label="Remove from shortlist" title="Remove from shortlist">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
