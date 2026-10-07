# AgentBridge

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

## Business model (built in)

- **Free** — browse, up to 3 live listings (enforced by a DB trigger)
- **Pro Agent** — €79/month, unlimited listings & requests
- **Agency** — €299/month, team seats & analytics
- **Success fee** — 7.5% of the buyer-agent commission from each side on deals closed through a Deal Room. Both agents accept this digitally before the reveal.

Plan limits live in `PLANS` (`src/lib/constants.ts`) and `enforce_listing_limit()` (migration). Billing (Stripe) is **not** wired up yet; change `agents.plan` manually for now.

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

### 3b. Demo data (optional)

```bash
node scripts/seed-demo.mjs
```

Needs `SUPABASE_SERVICE_KEY` in `.env` (server-side only — never `NEXT_PUBLIC_`). Creates six demo agencies with ~24 live listings
(Unsplash photos) and a few buyer briefs, and upgrades `admin@optinetsolutions.com` to the Agency plan. Safe to re-run.
Every demo login uses the password `Demo123456`:

| Email | Agency | Plan |
| --- | --- | --- |
| maria.borg@example.com | Harbour Homes Malta | Agency |
| matthew.spiteri@example.com | Prime Residences | Agency |
| jeanpaul.zammit@example.com | Zammit & Co Estates | Pro |
| daniela.vella@example.com | Coastline Property | Pro |
| luke.camilleri@example.com | Camilleri Realty | Free |
| sarah.grech@example.com | Gozo Living | Free |

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
