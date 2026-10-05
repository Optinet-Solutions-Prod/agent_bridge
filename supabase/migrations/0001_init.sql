-- ============================================================================
-- AgentBridge — initial schema
--
-- Privacy model (enforced in the database, not just the UI):
--   * agents            -> public, anonymous profile (anon code, plan, verified)
--   * agent_identities  -> PRIVATE. Visible to the owner, and to the counterparty
--                          only once a Deal Room has been accepted by BOTH sides.
--   * listings          -> public fields (price, type, size, locality, features…)
--   * listing_private   -> PRIVATE. Exact address / pin / viewing notes. Visible
--                          to the owner, and to the counterparty of an accepted
--                          Deal Room for that listing.
--   * deal_rooms        -> state machine: proposed -> active -> closed
--                          (identities + address are revealed when status = active)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.plan_tier       as enum ('free', 'pro', 'agency');
create type public.listing_status  as enum ('draft', 'active', 'under_offer', 'sold', 'withdrawn');
create type public.request_status  as enum ('active', 'fulfilled', 'closed');
create type public.deal_status     as enum ('proposed', 'active', 'closed', 'cancelled');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.agents (
  id          uuid primary key references auth.users (id) on delete cascade,
  anon_code   text not null unique,
  plan        public.plan_tier not null default 'free',
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.agent_identities (
  agent_id     uuid primary key references public.agents (id) on delete cascade,
  full_name    text,
  agency_name  text,
  phone        text,
  email        text,
  license_no   text,
  updated_at   timestamptz not null default now()
);

create table public.listings (
  id                          uuid primary key default gen_random_uuid(),
  agent_id                    uuid not null references public.agents (id) on delete cascade,
  title                       text not null check (length(title) between 3 and 120),
  property_type               text not null,
  status                      public.listing_status not null default 'active',
  price                       numeric(14, 2) not null check (price >= 0),
  currency                    text not null default 'EUR',
  bedrooms                    int check (bedrooms >= 0),
  bathrooms                   int check (bathrooms >= 0),
  size_sqm                    numeric(10, 2) check (size_sqm >= 0),
  outdoor_sqm                 numeric(10, 2) check (outdoor_sqm >= 0),
  locality                    text not null,
  region                      text,
  features                    text[] not null default '{}',
  description                 text,
  photo_urls                  text[] not null default '{}',
  buyer_agent_commission_pct  numeric(5, 2) not null default 2.5
                              check (buyer_agent_commission_pct between 0 and 10),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index listings_agent_idx  on public.listings (agent_id);
create index listings_browse_idx on public.listings (status, locality, property_type, price);

create table public.listing_private (
  listing_id         uuid primary key references public.listings (id) on delete cascade,
  address_line       text,
  block_or_building  text,
  street             text,
  lat                double precision,
  lng                double precision,
  viewing_notes      text,
  internal_notes     text,
  updated_at         timestamptz not null default now()
);

create table public.buyer_requests (
  id                  uuid primary key default gen_random_uuid(),
  agent_id            uuid not null references public.agents (id) on delete cascade,
  title               text not null check (length(title) between 3 and 120),
  property_types      text[] not null default '{}',
  localities          text[] not null default '{}',
  min_price           numeric(14, 2) check (min_price >= 0),
  max_price           numeric(14, 2) check (max_price >= 0),
  min_bedrooms        int check (min_bedrooms >= 0),
  min_size_sqm        numeric(10, 2) check (min_size_sqm >= 0),
  must_have_features  text[] not null default '{}',
  notes               text,
  status              public.request_status not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index buyer_requests_agent_idx on public.buyer_requests (agent_id);

create table public.conversations (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references public.listings (id) on delete cascade,
  buyer_agent_id    uuid not null references public.agents (id) on delete cascade,
  listing_agent_id  uuid not null references public.agents (id) on delete cascade,
  buyer_request_id  uuid references public.buyer_requests (id) on delete set null,
  created_at        timestamptz not null default now(),
  last_message_at   timestamptz not null default now(),
  unique (listing_id, buyer_agent_id),
  check (buyer_agent_id <> listing_agent_id)
);
create index conversations_buyer_idx   on public.conversations (buyer_agent_id, last_message_at desc);
create index conversations_listing_idx on public.conversations (listing_agent_id, last_message_at desc);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.agents (id) on delete cascade,
  body             text not null check (length(body) between 1 and 4000),
  created_at       timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.deal_rooms (
  id                          uuid primary key default gen_random_uuid(),
  conversation_id             uuid not null unique references public.conversations (id) on delete cascade,
  listing_id                  uuid not null references public.listings (id) on delete cascade,
  listing_agent_id            uuid not null references public.agents (id) on delete cascade,
  buyer_agent_id              uuid not null references public.agents (id) on delete cascade,
  proposed_by                 uuid not null references public.agents (id),
  buyer_agent_commission_pct  numeric(5, 2) not null,
  platform_fee_pct            numeric(5, 2) not null default 7.5,
  terms_version               text not null default 'v1',
  buyer_brief                 text,
  status                      public.deal_status not null default 'proposed',
  listing_agent_accepted_at   timestamptz,
  buyer_agent_accepted_at     timestamptz,
  revealed_at                 timestamptz,
  sale_price                  numeric(14, 2),
  closed_at                   timestamptz,
  created_at                  timestamptz not null default now()
);
create index deal_rooms_listing_agent_idx on public.deal_rooms (listing_agent_id);
create index deal_rooms_buyer_agent_idx   on public.deal_rooms (buyer_agent_id);

-- ---------------------------------------------------------------------------
-- Housekeeping triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger listings_set_updated_at        before update on public.listings         for each row execute function public.set_updated_at();
create trigger listing_private_set_updated_at before update on public.listing_private  for each row execute function public.set_updated_at();
create trigger buyer_requests_set_updated_at  before update on public.buyer_requests   for each row execute function public.set_updated_at();
create trigger identities_set_updated_at      before update on public.agent_identities for each row execute function public.set_updated_at();

create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end $$;

create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.touch_conversation();

-- ---------------------------------------------------------------------------
-- New user -> anonymous agent profile + private identity
-- ---------------------------------------------------------------------------
create or replace function public.generate_anon_code()
returns text language plpgsql as $$
declare
  code text;
begin
  loop
    code := 'MT' || lpad(floor(random() * 100000)::int::text, 5, '0');
    exit when not exists (select 1 from public.agents where anon_code = code);
  end loop;
  return code;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.agents (id, anon_code)
  values (new.id, public.generate_anon_code());

  insert into public.agent_identities (agent_id, full_name, agency_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'agency_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Plan limits (free plan: 3 live listings)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_listing_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  current_plan  public.plan_tier;
  live_count    int;
  max_allowed   int;
begin
  select plan into current_plan from public.agents where id = new.agent_id;
  max_allowed := case current_plan when 'free' then 3 else 100000 end;

  select count(*) into live_count
  from public.listings
  where agent_id = new.agent_id
    and status in ('draft', 'active', 'under_offer');

  if live_count >= max_allowed then
    raise exception 'Listing limit reached for the % plan. Upgrade to add more listings.', current_plan
      using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger listings_enforce_limit before insert on public.listings
  for each row execute function public.enforce_listing_limit();

-- ---------------------------------------------------------------------------
-- Access helpers (security definer so policies never recurse into RLS)
-- ---------------------------------------------------------------------------
create or replace function public.has_deal_with(other_agent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.deal_rooms d
    where d.status in ('active', 'closed')
      and (
        (d.listing_agent_id = auth.uid() and d.buyer_agent_id = other_agent) or
        (d.buyer_agent_id   = auth.uid() and d.listing_agent_id = other_agent)
      )
  );
$$;

create or replace function public.has_deal_on_listing(target_listing uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.deal_rooms d
    where d.listing_id = target_listing
      and d.status in ('active', 'closed')
      and auth.uid() in (d.listing_agent_id, d.buyer_agent_id)
  );
$$;

create or replace function public.is_conversation_participant(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv and auth.uid() in (c.buyer_agent_id, c.listing_agent_id)
  );
$$;

create or replace function public.owns_listing(target_listing uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.listings l where l.id = target_listing and l.agent_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Deal Room state machine (all transitions go through these RPCs)
-- ---------------------------------------------------------------------------
create or replace function public.open_deal_room(conv uuid, brief text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  c        public.conversations%rowtype;
  l        public.listings%rowtype;
  new_id   uuid;
begin
  select * into c from public.conversations where id = conv;
  if not found then raise exception 'Conversation not found'; end if;
  if auth.uid() not in (c.buyer_agent_id, c.listing_agent_id) then
    raise exception 'You are not a participant in this conversation';
  end if;
  if exists (select 1 from public.deal_rooms where conversation_id = conv) then
    raise exception 'A deal room already exists for this conversation';
  end if;

  select * into l from public.listings where id = c.listing_id;

  insert into public.deal_rooms (
    conversation_id, listing_id, listing_agent_id, buyer_agent_id, proposed_by,
    buyer_agent_commission_pct, buyer_brief,
    buyer_agent_accepted_at, listing_agent_accepted_at
  ) values (
    c.id, c.listing_id, c.listing_agent_id, c.buyer_agent_id, auth.uid(),
    l.buyer_agent_commission_pct, brief,
    case when auth.uid() = c.buyer_agent_id   then now() end,
    case when auth.uid() = c.listing_agent_id then now() end
  )
  returning id into new_id;

  return new_id;
end $$;

create or replace function public.accept_deal_room(deal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  d public.deal_rooms%rowtype;
begin
  select * into d from public.deal_rooms where id = deal for update;
  if not found then raise exception 'Deal room not found'; end if;
  if d.status <> 'proposed' then raise exception 'This deal room is no longer awaiting acceptance'; end if;

  if auth.uid() = d.buyer_agent_id then
    update public.deal_rooms set buyer_agent_accepted_at = coalesce(buyer_agent_accepted_at, now()) where id = deal;
  elsif auth.uid() = d.listing_agent_id then
    update public.deal_rooms set listing_agent_accepted_at = coalesce(listing_agent_accepted_at, now()) where id = deal;
  else
    raise exception 'You are not a participant in this deal room';
  end if;

  -- Both sides agreed -> lock terms and reveal identities + exact location.
  update public.deal_rooms
     set status = 'active', revealed_at = now()
   where id = deal
     and buyer_agent_accepted_at is not null
     and listing_agent_accepted_at is not null;
end $$;

create or replace function public.cancel_deal_room(deal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  d public.deal_rooms%rowtype;
begin
  select * into d from public.deal_rooms where id = deal for update;
  if not found then raise exception 'Deal room not found'; end if;
  if auth.uid() not in (d.buyer_agent_id, d.listing_agent_id) then
    raise exception 'You are not a participant in this deal room';
  end if;
  -- Once both sides have agreed the terms are binding; only pending rooms can be cancelled.
  if d.status <> 'proposed' then raise exception 'An agreed deal room cannot be cancelled unilaterally'; end if;
  update public.deal_rooms set status = 'cancelled' where id = deal;
end $$;

create or replace function public.close_deal_room(deal uuid, final_price numeric)
returns void language plpgsql security definer set search_path = public as $$
declare
  d public.deal_rooms%rowtype;
begin
  select * into d from public.deal_rooms where id = deal for update;
  if not found then raise exception 'Deal room not found'; end if;
  if auth.uid() <> d.listing_agent_id then raise exception 'Only the listing agent can close a deal'; end if;
  if d.status <> 'active' then raise exception 'Only an active deal room can be closed'; end if;
  if final_price is null or final_price <= 0 then raise exception 'A valid sale price is required'; end if;

  update public.deal_rooms set status = 'closed', sale_price = final_price, closed_at = now() where id = deal;
  update public.listings set status = 'sold' where id = d.listing_id;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.agents            enable row level security;
alter table public.agent_identities  enable row level security;
alter table public.listings          enable row level security;
alter table public.listing_private   enable row level security;
alter table public.buyer_requests    enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.deal_rooms        enable row level security;

-- agents: anonymous profiles are visible to every signed-in agent
create policy "agents: read all"     on public.agents for select to authenticated using (true);
create policy "agents: update own"   on public.agents for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- agent_identities: owner, or counterparty of an accepted deal room
create policy "identities: own or deal counterparty" on public.agent_identities for select to authenticated
  using (auth.uid() = agent_id or public.has_deal_with(agent_id));
create policy "identities: update own" on public.agent_identities for update to authenticated
  using (auth.uid() = agent_id) with check (auth.uid() = agent_id);

-- listings: live inventory is visible to everyone signed in; own listings always
create policy "listings: read live or own" on public.listings for select to authenticated
  using (status in ('active', 'under_offer') or agent_id = auth.uid());
create policy "listings: insert own" on public.listings for insert to authenticated
  with check (agent_id = auth.uid());
create policy "listings: update own" on public.listings for update to authenticated
  using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create policy "listings: delete own" on public.listings for delete to authenticated
  using (agent_id = auth.uid());

-- listing_private: owner, or counterparty of an accepted deal room for this listing
create policy "listing_private: read own or deal" on public.listing_private for select to authenticated
  using (public.owns_listing(listing_id) or public.has_deal_on_listing(listing_id));
create policy "listing_private: insert own" on public.listing_private for insert to authenticated
  with check (public.owns_listing(listing_id));
create policy "listing_private: update own" on public.listing_private for update to authenticated
  using (public.owns_listing(listing_id)) with check (public.owns_listing(listing_id));
create policy "listing_private: delete own" on public.listing_private for delete to authenticated
  using (public.owns_listing(listing_id));

-- buyer_requests
create policy "requests: read active or own" on public.buyer_requests for select to authenticated
  using (status = 'active' or agent_id = auth.uid());
create policy "requests: insert own" on public.buyer_requests for insert to authenticated
  with check (agent_id = auth.uid());
create policy "requests: update own" on public.buyer_requests for update to authenticated
  using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create policy "requests: delete own" on public.buyer_requests for delete to authenticated
  using (agent_id = auth.uid());

-- conversations: participants only. Either side may open one, but the listing
-- agent must really own the listing.
create policy "conversations: read participant" on public.conversations for select to authenticated
  using (auth.uid() in (buyer_agent_id, listing_agent_id));
create policy "conversations: insert participant" on public.conversations for insert to authenticated
  with check (
    auth.uid() in (buyer_agent_id, listing_agent_id)
    and buyer_agent_id <> listing_agent_id
    and exists (select 1 from public.listings l where l.id = listing_id and l.agent_id = listing_agent_id)
  );

-- messages
create policy "messages: read participant" on public.messages for select to authenticated
  using (public.is_conversation_participant(conversation_id));
create policy "messages: send as self" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));

-- deal_rooms: read-only for participants; all writes go through the RPCs above
create policy "deals: read participant" on public.deal_rooms for select to authenticated
  using (auth.uid() in (listing_agent_id, buyer_agent_id));

-- ---------------------------------------------------------------------------
-- Realtime (live chat) + Storage (listing photos)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "photos: public read" on storage.objects for select
  using (bucket_id = 'listing-photos');
create policy "photos: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
