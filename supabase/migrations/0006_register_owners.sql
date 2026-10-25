-- ============================================================================
-- Ponte — registered owners (holiday-rental register, RNAL)
--
-- A demo sample of rentals from Turismo de Portugal's public register, with
-- the operator who runs each one (owner, tenant or borrower). The register
-- publishes operator names and contacts under DL 128/2014, art. 10.
--
--   register_rentals   what and where: every signed-in agent can read it
--   register_contacts  operator names, emails, phones and the street address:
--                      readable ONLY by the admin login, because demo mode lets
--                      anyone on the internet sign in as a guest
--   register_tracking  each agent's private status and notes per rental
--
-- Rows are written by scripts/import-rnal.mjs with the service key.
-- Run this whole file once in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.register_rentals (
  rnal_nr        text primary key,          -- register number, e.g. '182013'
  name           text,                      -- establishment name
  modality       text,                      -- Apartamento, Moradia, Quartos, ...
  guests         int,
  rooms          int,
  beds           int,
  parish         text,
  municipality   text,
  district       text,
  postcode       text,
  registered_on  date,
  opened_on      date,
  operator_role  text,                      -- first operator: Owner, Tenant, Borrower, ...
  operator_kind  text,                      -- 'person' or 'company'
  operators      int not null default 1,
  has_email      boolean not null default false,
  has_phone      boolean not null default false,
  source_url     text not null,
  checked_on     date,
  imported_at    timestamptz not null default now()
);

create index if not exists register_rentals_place_idx on public.register_rentals (district, municipality);

create table if not exists public.register_contacts (
  rnal_nr    text primary key references public.register_rentals(rnal_nr) on delete cascade,
  address    text,
  operators  jsonb not null default '[]'::jsonb   -- [{ role, role_en, kind, name, email, phone }]
);

create table if not exists public.register_tracking (
  rnal_nr     text not null references public.register_rentals(rnal_nr) on delete cascade,
  agent_id    uuid not null references public.agents(id) on delete cascade,
  status      public.lead_status not null default 'new',
  notes       text,
  updated_at  timestamptz not null default now(),
  primary key (rnal_nr, agent_id)
);

drop trigger if exists register_tracking_set_updated_at on public.register_tracking;
create trigger register_tracking_set_updated_at before update on public.register_tracking
  for each row execute function public.set_updated_at();

-- Who may see operator contacts: the admin login only.
create or replace function public.can_see_owner_contacts()
returns boolean
language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'admin@optinetsolutions.com', false)
$$;

alter table public.register_rentals  enable row level security;
alter table public.register_contacts enable row level security;
alter table public.register_tracking enable row level security;

drop policy if exists "register rentals: read" on public.register_rentals;
create policy "register rentals: read" on public.register_rentals
  for select to authenticated using (true);

drop policy if exists "register contacts: admin only" on public.register_contacts;
create policy "register contacts: admin only" on public.register_contacts
  for select to authenticated using (public.can_see_owner_contacts());

drop policy if exists "register tracking: own" on public.register_tracking;
create policy "register tracking: own" on public.register_tracking
  for all to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

-- Sanity check: should return three rows.
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('register_rentals', 'register_contacts', 'register_tracking');
