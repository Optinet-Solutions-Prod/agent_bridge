# AgentBridge — product truth

## What it is
A private property network for Portugal. Real-estate agencies pool the homes they hold so every agency's buyers can find them, without exposing the exact address, the owner or the agent's identity until co-broker terms are agreed. Public visitors can browse what is on the market; agents use the app behind it.

## Who it serves
- **Home buyers and the public (landing page, first):** people looking for a home in Portugal — Lisbon, Cascais, Porto, Comporta, the Algarve, Madeira — including international buyers. They want to see real homes with real prices fast, on a phone.
- **Agents and agencies (the app):** Portuguese agencies who want their stock in front of every other agency's buyers, and buyers' agents who need to find stock for a client brief quickly.

## The mechanism (what only this product proves)
1. Agents list anonymously: price, type, size, locality, features, photos and the buyer-agent commission. Address and identity stay private (enforced in the database).
2. Buyers' agents enter a client brief and **swipe** through matching homes; a right swipe ("Interested!") shortlists; when several agents want the same home the owner sees competing interest.
3. Agents chat anonymously (Agent #…); a **Deal Room** locks the commission split and the 7.5% platform fee digitally; only then are names, contacts and the address revealed.

## Data
- Market listings for Portugal are **supplied as data** by the business (no scraping feature in the product). Until the feed is connected the landing page shows clearly labelled sample homes.
- Agents' own listings come from the app.

## Brand commitments
- Name: **AgentBridge** (kept for Portugal).
- Language: English first; Portuguese version planned.
- Visual direction chosen on 2026-10-25: **"Lisbon light"** — limestone-white ground, deep azulejo cobalt as the committed colour, warm golden-hour photography, a warm low-contrast display serif. Calm and premium; Portuguese without tile-pattern clichés.
- Mobile first. Animations welcome when they explain or confirm; no scattered decorative motion.
- Must not read as generic AI/template output.

## Constraints
- Next.js 16 App Router, Tailwind v4, Supabase, Vercel. Images via next/image (Unsplash allowed for samples).
- Demo mode is on: "Open the app" signs visitors in as a guest agent.
- Pricing is deliberately not shown in the product for now (decision 2026-10-25); plan tiers remain in the database.
