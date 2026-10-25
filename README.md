# Ponte (formerly Ponte)

**The private MLS for real-estate agents.** Agents share the inventory they hold with every other agency — without exposing the exact location, the owner or their own identity. Agents match buyers to stock, chat anonymously, and only after both sides accept co-broker terms in a **Deal Room** are names, contact details and the address revealed. The platform's success fee is locked in *before* the reveal, so nobody can take the deal offline to avoid it.

Stack: **Next.js 16 (App Router) · Supabase (Postgres, Auth, Storage, Realtime) · Tailwind CSS v4 · Vercel**.

---

## How privacy is enforced

Privacy is enforced by **Postgres Row-Level Security**, not just by hiding fields in the UI:

| Table | Who can read it |
| --- | --- |
| `agents` (anon code, plan, verified) | every signed-in agent |
| `agent_identities` (name, agency, phone, email) | the owner — and the counterparty of a Deal Room **both** sides have accepted |
| `listings` (price, type, size, locality, features, photos, commission) | every signed-in agent |
| `listing_private` (address, building, viewing notes) | the owner — and the counterparty of an accepted Deal Room for that listing |
| `conversations` / `messages` | the two participants |
| `deal_rooms` | the two participants (writes only via RPC) |

Deal Room transitions (`open_deal_room`, `accept_deal_room`, `cancel_deal_room`, `close_deal_room`) are `security definer` functions, so the state machine can't be bypassed from the client. An agreed room (`status = active`) cannot be cancelled unilaterally.

## Plans and fees

Pricing is **not shown anywhere in the product for now** (the `/pricing` page was removed and redirects home). Plan tiers still
exist in the database (`agents.plan`, free plan limited to 3 live listings by a trigger) and in `PLANS` in `src/lib/constants.ts`,
so they can be surfaced again later. Deal Rooms still record the platform fee as part of the co-broker terms.

---

## Setup

### 1. Supabase

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor** and run every file in `supabase/migrations/` in order (`0001_init.sql`, then `0002_swipes.sql`), or `supabase db push` if you use the CLI.
   This creates all tables, RLS policies, RPCs, the `listing-photos` storage bucket, Realtime on `messages`, and the swipe table.
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (later your Vercel URL)
   - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://<your-app>.vercel.app/auth/callback`
4. (Optional, for fast local testing) **Authentication → Providers → Email → disable "Confirm email"** so signups log in immediately.

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in from **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # or the legacy anon key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Create two accounts (use two browsers) to try the full flow: list → browse → message → Deal Room → accept on both sides → reveal.

### Landing page and sample homes

The landing page (`src/app/page.tsx`, components in `src/components/landing/cinematic/`) is a scroll-driven film of homes across Portugal built with GSAP ScrollTrigger and Lenis (hero, pinned home sequence, bento gallery, Portugal map, live swipe demo, steps, closing). Until the real listings
feed is connected it renders the sample data in `src/data/portugal-showcase.ts`; replace that array (same shape) and set
`SHOWCASE_IS_SAMPLE = false` to drop the "sample homes" note. Design decisions are recorded in `DESIGN.md`, product truth in `PRODUCT.md`.
Design skills used during the build are vendored in `.claude/skills/` (Impeccable, Emil Kowalski's animation/mobile skills, Vercel's
web design guidelines) plus Anthropic's `frontend-design` plugin.

### Owner leads (private-owner listings supplied as data)

Spreadsheets of listings placed directly by private owners (e.g. `data/Portugal_Owners_Sample.xlsx`) are imported — never
scraped by the app — with:

```bash
node scripts/import-owner-leads.mjs path/to/file.xlsx            # add --dry-run to preview the column mapping
node scripts/import-owner-leads.mjs file.csv --district Porto --platform Idealista
```

Rows upsert on `(platform, listing_id)`, known columns map to typed fields and anything else is kept in the `extra` JSON column,
so a feed can grow without a migration. Needs `supabase/migrations/0004_owner_leads.sql`. Agents browse and filter leads at
`/leads`, keeping a private status (New → Contacted → Appointment → Listed / Not interested) and notes per lead; the landing page
shows only aggregates per area via `owner_lead_overview()`.

### 3a. Demo mode (no login)

`NEXT_PUBLIC_DEMO_MODE` defaults to **on**: visitors who open an app page are signed in automatically as the shared
guest agent (`guest@example.com`), and a **Demo · act as** switcher in the sidebar lets anyone become one of the seeded
demo agents to try both sides of a swipe → match → chat → Deal Room flow. `/login` still works for real accounts.
Set `NEXT_PUBLIC_DEMO_MODE=false` in Vercel to put the login wall back.

### 3b. Demo data (optional)

```bash
node scripts/seed-demo.mjs
```

Needs `SUPABASE_SERVICE_KEY` in `.env` (server-side only — never `NEXT_PUBLIC_`). Creates six Portuguese demo agencies whose live listings are the showcase homes, plus buyer briefs and some
"Interested!" swipes, and upgrades `admin@optinetsolutions.com` to the Agency plan. Safe to re-run (Node 22.6+).
Every demo login uses the password `Demo123456`:

| Email | Agent # | Agency | Plan |
| --- | --- | --- | --- |
| guest@example.com | — | Demo Agency (what visitors use) | Agency |
| ines.carvalho@example.com | PT21184 | Carvalho & Sousa Imobiliária, Lisboa | Agency |
| tiago.ferreira@example.com | PT18833 | Atlântico Properties, Cascais & Sintra | Agency |
| rita.almeida@example.com | PT61175 | Comporta Living, Comporta & Alentejo | Pro |
| joao.pinto@example.com | PT27306 | Douro Estates, Porto | Free |
| sofia.mendes@example.com | PT70044 | Costa Sul Properties, Algarve | Pro |
| miguel.santos@example.com | PT90512 | Ilha Homes, Madeira | Free |

The listings are the 21 showcase homes from `src/data/portugal-showcase.ts`, so the landing page and the app show the same stock.

### 4. Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the three environment variables above (set `NEXT_PUBLIC_SITE_URL` to the production URL).
3. Add the production callback URL in Supabase (step 1.3).

---

## Project layout

```
supabase/migrations/0001_init.sql   schema, RLS, RPCs, storage, realtime
src/proxy.ts                        session refresh + route protection (Next 16 "proxy", formerly middleware)
src/lib/supabase/                   server / browser / proxy Supabase clients
src/lib/constants.ts                localities, property types, plans, co-broker terms
src/lib/matching.ts                 buyer-request ⇄ listing matching queries
src/app/(auth)/                     login, signup
src/app/(app)/dashboard             overview, matches, pending Deal Rooms
src/app/(app)/listings              browse / create / edit / detail (+ private panel)
src/app/(app)/discover              Tinder-style swipe deck per client brief + shortlist
src/components/swipe-deck.tsx       drag / keyboard swipe cards, optimistic save
scripts/seed-demo.mjs               demo agencies, listings and briefs
src/app/(app)/requests              buyer demand, propose stock anonymously
src/app/(app)/messages              anonymous realtime chat
src/app/(app)/deals                 Deal Rooms: terms, acceptance, reveal, close
src/app/(app)/settings              private profile, plan
```

## Roadmap

- Stripe subscriptions + invoicing the success fee on `close_deal_room`
- Agent verification workflow (licence check → `agents.verified`)
- Email / push notifications for new matches and messages
- Agency accounts with multiple seats
- Approximate-area map (locality polygon, never a pin) on listings
- Analytics: demand by locality, time-to-match, average commission
