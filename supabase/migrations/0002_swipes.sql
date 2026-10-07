-- ============================================================================
-- AgentBridge — swipe matching
--
-- One row per agent × buyer brief × listing. "like" builds the shortlist for
-- that brief; "pass" hides the listing from future decks for that brief.
-- buyer_request_id is null when the agent swipes with ad-hoc criteria instead
-- of a saved buyer request.
-- ============================================================================

create type public.swipe_decision as enum ('like', 'pass');

create table public.listing_swipes (
  id               uuid primary key default gen_random_uuid(),
  agent_id         uuid not null references public.agents(id) on delete cascade,
  buyer_request_id uuid references public.buyer_requests(id) on delete cascade,
  listing_id       uuid not null references public.listings(id) on delete cascade,
  decision         public.swipe_decision not null,
  created_at       timestamptz not null default now(),
  -- nulls not distinct: one decision per (agent, brief-or-none, listing).
  unique nulls not distinct (agent_id, buyer_request_id, listing_id)
);

create index listing_swipes_agent_brief_idx
  on public.listing_swipes (agent_id, buyer_request_id, decision, created_at desc);

alter table public.listing_swipes enable row level security;

create policy "swipes: own" on public.listing_swipes
  for all to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());
