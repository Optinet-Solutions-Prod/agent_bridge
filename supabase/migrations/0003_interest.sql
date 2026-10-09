-- ============================================================================
-- AgentBridge — interest counts for the swipe deck and listing owners
--
-- Swipes are private (RLS: own rows only). This security-definer function
-- exposes only an aggregate: how many *other* agents shortlisted a listing.
-- The anonymous handles of those agents are returned only to the listing's
-- owner, so they can see who (anonymously) wants their stock.
-- ============================================================================

create or replace function public.listing_interest(listing_ids uuid[])
returns table (listing_id uuid, interested int, agents jsonb)
language sql stable security definer set search_path = public as $$
  select l.id,
         count(distinct s.agent_id)::int,
         case when l.agent_id = auth.uid()
              then jsonb_agg(distinct jsonb_build_object('anon_code', a.anon_code, 'verified', a.verified))
              else null end
  from public.listings l
  join public.listing_swipes s
    on s.listing_id = l.id
   and s.decision = 'like'
   and s.agent_id <> auth.uid()
  join public.agents a on a.id = s.agent_id
  where l.id = any(listing_ids)
  group by l.id, l.agent_id
$$;

revoke all on function public.listing_interest(uuid[]) from public;
grant execute on function public.listing_interest(uuid[]) to authenticated;
