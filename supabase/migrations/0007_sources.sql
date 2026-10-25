-- ============================================================================
-- Ponte — more owner sources
--
--   register_rentals    + the full holiday-rental register (RNAL open data,
--                         ~112k rentals: what, where, when; no personal data).
--                         Operator details are fetched one record at a time
--                         by the admin ("Get operator details").
--   tourism_properties  the tourist-property register (RNET open data):
--                         hotels, country houses, agritourism, manor houses,
--                         with the owning and operating entity, email, website.
--   companies           company facts for entities that own or run them
--                         (tax number, head office, legal form, capital,
--                         activity, founded), from the public company directory.
--
-- Run this whole file once in the Supabase SQL editor, after 0006.
-- ============================================================================

-- Holiday rentals: open-data columns ------------------------------------------
alter table public.register_rentals add column if not exists address     text;
alter table public.register_rentals add column if not exists locality    text;
alter table public.register_rentals add column if not exists region      text;     -- NUTS II
alter table public.register_rentals add column if not exists lat         double precision;
alter table public.register_rentals add column if not exists lng         double precision;
alter table public.register_rentals add column if not exists source      text not null default 'RNAL open data';
alter table public.register_rentals add column if not exists enriched_at timestamptz;
alter table public.register_rentals add column if not exists nipc        text;     -- only for company operators
alter table public.register_rentals alter column operators drop not null;
alter table public.register_rentals alter column operators drop default;

-- The 150 records collected earlier already carry operator details.
update public.register_rentals set enriched_at = coalesce(enriched_at, imported_at) where operator_role is not null;

alter table public.register_rentals add column if not exists nr_num bigint generated always as (rnal_nr::bigint) stored;
create index if not exists register_rentals_nr_num_idx on public.register_rentals (nr_num desc);
create index if not exists register_rentals_enriched_idx on public.register_rentals (enriched_at) where enriched_at is not null;

-- Admin-only: save the operator details fetched from one official record.
create or replace function public.save_register_operator(p_nr text, p_rental jsonb, p_contact jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_see_owner_contacts() then
    raise exception 'Only the admin can fetch operator details';
  end if;
  update register_rentals set
    name          = coalesce(p_rental->>'name', name),
    modality      = coalesce(p_rental->>'modality', modality),
    guests        = coalesce((p_rental->>'guests')::int, guests),
    rooms         = coalesce((p_rental->>'rooms')::int, rooms),
    beds          = coalesce((p_rental->>'beds')::int, beds),
    registered_on = coalesce((p_rental->>'registered_on')::date, registered_on),
    opened_on     = coalesce((p_rental->>'opened_on')::date, opened_on),
    operator_role = p_rental->>'operator_role',
    operator_kind = p_rental->>'operator_kind',
    operators     = (p_rental->>'operators')::int,
    has_email     = coalesce((p_rental->>'has_email')::boolean, false),
    has_phone     = coalesce((p_rental->>'has_phone')::boolean, false),
    nipc          = p_rental->>'nipc',
    checked_on    = current_date,
    enriched_at   = now()
  where rnal_nr = p_nr;
  insert into register_contacts (rnal_nr, address, operators)
  values (p_nr, p_contact->>'address', coalesce(p_contact->'operators', '[]'::jsonb))
  on conflict (rnal_nr) do update set address = excluded.address, operators = excluded.operators;
end;
$$;
revoke all on function public.save_register_operator(text, jsonb, jsonb) from public, anon;
grant execute on function public.save_register_operator(text, jsonb, jsonb) to authenticated;

-- Counts for the page header and district filter (PostgREST caps plain selects at 1,000 rows).
create or replace function public.register_overview()
returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'total',     (select count(*) from register_rentals),
    'enriched',  (select count(*) from register_rentals where enriched_at is not null),
    'owners',    (select count(*) from register_rentals where operator_role = 'Owner'),
    'with_email',(select count(*) from register_rentals where has_email),
    'with_phone',(select count(*) from register_rentals where has_phone),
    'checked_on',(select max(checked_on) from register_rentals),
    'by_district', (select coalesce(jsonb_agg(jsonb_build_object('district', district, 'n', n) order by n desc), '[]'::jsonb)
                    from (select district, count(*)::int n from register_rentals where district is not null group by district) d)
  )
$$;
grant execute on function public.register_overview() to authenticated;

-- Tourist properties ----------------------------------------------------------
create table if not exists public.tourism_properties (
  rnet_nr          text primary key,
  name             text,
  type             text,          -- Hotel, CasaDeCampo, Agroturismo, TurismoDeHabitacao, ...
  category         int,           -- stars, where it applies
  units            int,
  beds             int,
  rooms            int,
  owner_entity     text,
  operator_entity  text,
  email            text,
  website          text,
  address          text,
  postcode         text,
  locality         text,
  parish           text,
  municipality     text,
  district         text,
  region           text,
  lat              double precision,
  lng              double precision,
  golf             boolean,
  spa              boolean,
  listed_building  boolean,
  opened_on        date,
  source           text not null default 'RNET open data',
  source_url       text not null,
  checked_on       date,
  imported_at      timestamptz not null default now()
);
create index if not exists tourism_properties_place_idx on public.tourism_properties (district, municipality);
create index if not exists tourism_properties_type_idx on public.tourism_properties (type);

alter table public.tourism_properties enable row level security;
drop policy if exists "tourism properties: read" on public.tourism_properties;
create policy "tourism properties: read" on public.tourism_properties for select to authenticated using (true);

create table if not exists public.tourism_tracking (
  rnet_nr     text not null references public.tourism_properties(rnet_nr) on delete cascade,
  agent_id    uuid not null references public.agents(id) on delete cascade,
  status      public.lead_status not null default 'new',
  notes       text,
  updated_at  timestamptz not null default now(),
  primary key (rnet_nr, agent_id)
);
drop trigger if exists tourism_tracking_set_updated_at on public.tourism_tracking;
create trigger tourism_tracking_set_updated_at before update on public.tourism_tracking
  for each row execute function public.set_updated_at();
alter table public.tourism_tracking enable row level security;
drop policy if exists "tourism tracking: own" on public.tourism_tracking;
create policy "tourism tracking: own" on public.tourism_tracking
  for all to authenticated using (agent_id = auth.uid()) with check (agent_id = auth.uid());

create or replace function public.tourism_overview()
returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'total',        (select count(*) from tourism_properties),
    'with_website', (select count(*) from tourism_properties where coalesce(website, '') <> ''),
    'owner_differs',(select count(*) from tourism_properties where owner_entity is distinct from operator_entity),
    'checked_on',   (select max(checked_on) from tourism_properties),
    'by_type',      (select coalesce(jsonb_agg(jsonb_build_object('type', type, 'n', n) order by n desc), '[]'::jsonb)
                     from (select type, count(*)::int n from tourism_properties group by type) t),
    'by_district',  (select coalesce(jsonb_agg(jsonb_build_object('district', district, 'n', n) order by n desc), '[]'::jsonb)
                     from (select district, count(*)::int n from tourism_properties where district is not null group by district) d)
  )
$$;
grant execute on function public.tourism_overview() to authenticated;

-- Companies -------------------------------------------------------------------
create table if not exists public.companies (
  name_key     text primary key,     -- upper-case name without accents or punctuation
  name         text not null,
  found        boolean not null default false,
  nif          text,
  address      text,
  legal_form   text,
  capital      text,
  activity     text,
  founded_on   date,
  source       text not null default 'Racius company directory',
  source_url   text,
  checked_on   date
);
alter table public.companies enable row level security;
drop policy if exists "companies: read" on public.companies;
create policy "companies: read" on public.companies for select to authenticated using (true);

-- Sanity check
select 'register_rentals' t, count(*) from public.register_rentals
union all select 'tourism_properties', count(*) from public.tourism_properties
union all select 'companies', count(*) from public.companies;
