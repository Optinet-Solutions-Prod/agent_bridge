-- ============================================================================
-- AgentBridge — owner leads
--
-- Listings placed directly by private owners ("particular") on public
-- portals, supplied to the platform as data files (the app never scrapes).
-- Every signed-in agent can read the leads; each agent keeps a private status
-- and notes per lead. The landing page only ever sees aggregates, through
-- owner_lead_overview(), which anon may call.
-- ============================================================================

create type public.lead_offer  as enum ('sale', 'rent');
create type public.lead_status as enum ('new', 'contacted', 'appointment', 'listed', 'not_interested');

create table public.owner_leads (
  id                   uuid primary key default gen_random_uuid(),
  platform             text not null,                 -- OLX, Idealista, ...
  listing_id           text not null,                 -- the portal's own id
  offer                public.lead_offer not null,
  typology             text,                          -- T0, T1, T2, ...
  area                 text not null,                 -- parish / neighbourhood
  district             text not null default 'Lisboa',
  price_eur            numeric,                       -- asking price; monthly for rent
  size_sqm             numeric,
  evidence_url         text,
  advertiser_evidence  text,                          -- how the advertiser presents themselves
  owner_status         text,                          -- e.g. 'Not verified', 'Self-claimed'
  phone_visibility     text,                          -- e.g. 'No', 'Masked', 'Yes'
  extra                jsonb not null default '{}'::jsonb,  -- any columns a later feed adds
  source_checked_on    date,
  imported_at          timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (platform, listing_id)
);

create index owner_leads_area_idx  on public.owner_leads (district, area);
create index owner_leads_offer_idx on public.owner_leads (offer, price_eur);

create trigger owner_leads_set_updated_at before update on public.owner_leads
  for each row execute function public.set_updated_at();

-- Each agent's private follow-up on a lead.
create table public.owner_lead_tracking (
  lead_id     uuid not null references public.owner_leads(id) on delete cascade,
  agent_id    uuid not null references public.agents(id) on delete cascade,
  status      public.lead_status not null default 'new',
  notes       text,
  updated_at  timestamptz not null default now(),
  primary key (lead_id, agent_id)
);

create trigger owner_lead_tracking_set_updated_at before update on public.owner_lead_tracking
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.owner_leads enable row level security;
alter table public.owner_lead_tracking enable row level security;

-- Leads are shared read-only inventory; writes come only from the import script (service role).
create policy "owner leads: read" on public.owner_leads
  for select to authenticated using (true);

create policy "lead tracking: own" on public.owner_lead_tracking
  for all to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Public aggregates for the landing page (no individual listings leave here)
-- ---------------------------------------------------------------------------
create or replace function public.owner_lead_overview()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'total',  (select count(*) from owner_leads),
    'sale',   (select count(*) from owner_leads where offer = 'sale'),
    'rent',   (select count(*) from owner_leads where offer = 'rent'),
    'areas',  (select count(distinct area) from owner_leads),
    'median_sale_eur',
      (select percentile_cont(0.5) within group (order by price_eur)
         from owner_leads where offer = 'sale' and price_eur is not null),
    'median_sale_eur_sqm',
      (select percentile_cont(0.5) within group (order by price_eur / size_sqm)
         from owner_leads where offer = 'sale' and price_eur is not null and size_sqm > 0),
    'median_rent_eur',
      (select percentile_cont(0.5) within group (order by price_eur)
         from owner_leads where offer = 'rent' and price_eur is not null),
    'checked_on', (select max(source_checked_on) from owner_leads),
    'by_area', (
      select coalesce(jsonb_agg(to_jsonb(a) order by a.listings desc, a.area), '[]'::jsonb)
      from (
        select district,
               area,
               count(*)::int                                   as listings,
               count(*) filter (where offer = 'sale')::int     as sale,
               count(*) filter (where offer = 'rent')::int     as rent,
               percentile_cont(0.5) within group (order by price_eur)
                 filter (where offer = 'sale' and price_eur is not null)                 as median_sale_eur,
               percentile_cont(0.5) within group (order by price_eur / size_sqm)
                 filter (where offer = 'sale' and price_eur is not null and size_sqm > 0) as median_sale_eur_sqm,
               percentile_cont(0.5) within group (order by price_eur)
                 filter (where offer = 'rent' and price_eur is not null)                 as median_rent_eur
        from owner_leads
        group by district, area
      ) a
    )
  )
$$;

revoke all on function public.owner_lead_overview() from public;
grant execute on function public.owner_lead_overview() to anon, authenticated;
