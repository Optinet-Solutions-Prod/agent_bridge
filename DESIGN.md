# AgentBridge — design system ("Lisbon light")

Chosen 2026-10-25 for the Portugal relaunch. Tokens live in `src/app/globals.css` (`@theme`); this file explains the intent so later work extends the world instead of replacing it.

## World
Limestone and cobalt. A pale warm ground like Lisbon's stone pavements and façades, deep azulejo blue as the one committed colour, photography doing the talking. Calm, premium, Portuguese without tile patterns or clichés. Agents and buyers should feel the page was built for homes in Portugal, not for "property tech".

## Colour
| Token | Hex | Use |
| --- | --- | --- |
| `limestone` | `#F8F7F3` | Page ground, buttons on cobalt |
| `ink` | `#14213D` | All text, gradients over photos |
| `sand` | `#EDE6D8` | Image placeholders, quiet secondary surfaces |
| `glaze` / `brand-100` | `#E4EBF7` | Tints, selection |
| `brand-700` | `#1B3F8F` | Primary action, active chip, links |
| `brand-800` | `#163376` | Committed regions (the agents band), hover |
| `brand-950` | `#0A1C45` | Darkest accents |

Rules: cobalt owns whole regions (a full band, a primary button), never scattered accents. Secondary text is `ink` at 70–85% opacity, never grey; 60% and below is reserved for text ≥ 24px. Emerald (`emerald-600/700`) means "interested", rose means "not interested", orange means competing interest; nothing else borrows those hues.

## Type
- **Display:** Young Serif (single weight). Headlines, prices, step numerals. Tight leading (1.02–1.08), tracking −0.02em on the hero only.
- **Body/UI:** Hanken Grotesk. 15–17px body, 13px captions, tabular numerals for counts.
- No eyebrow labels above headings, no all-caps labels, no arrows appended to buttons, no middle-dot meta strings (write "Cascais, Lisboa").
- Headings `text-wrap: balance`; paragraphs `text-wrap: pretty`; body measure ≤ 52ch.

## Shape and depth
- Radii: 20–28px for photo cards and sheets, full pills for controls, 12–16px inside the app.
- One elevation language: hairline `ink/15` borders on controls, soft offset shadows only on floating cards. No coloured glows.
- Photos are the material: full-bleed hero and film frames, 4:5 cards (featured cards 2×2 in the bento), gradients from `ink` to transparent for legibility. Unsplash photos are served from Unsplash's CDN via `src/lib/image-loader.ts` with a 24px blur placeholder.

## Motion
- The landing page is a scroll film (GSAP ScrollTrigger + Lenis smooth scroll, `src/components/landing/cinematic/`):
  a Ken Burns hero with a masked word reveal, a pinned sequence where one home dissolves into the next with its price
  counting up, a bento gallery whose cards rise in and tilt in 3D under the pointer, a map of Portugal that draws itself
  with pulsing district dots and count-ups, a live swipe deck, steps whose connecting line draws with scroll, and a
  parallax closing. Lenis leaves touch scrolling native; wheel/keyboard scroll is eased.
- Between sections the page never cuts (`cinematic/transitions.tsx`, all scrubbed to scroll): the hero stays pinned and
  dims while the film slides over it; the film's last frame recedes under the gallery, which arrives as a rounded sheet;
  the map rises as a sheet; cobalt wells up out of the map as an expanding circle; the steps enter as a slanted curtain
  that straightens; the closing photograph zooms from an inset frame to full bleed. Section headings share the hero's
  masked line reveal, and a 2px progress line in the header threads the whole scroll together.
- Inside the app: one orchestrated moment per screen at most; otherwise motion only answers a user action (filter
  re-sorts via View Transitions, sheets via `@starting-style`, press feedback `scale(0.97–0.985)` at 100–160ms).
- Curves: `power4.out` for entrances, `power3.inOut` for on-screen movement, `back.out(1.6)` for pops; CSS tokens
  `--ease-out-strong` / `--ease-in-out-strong` mirror them. UI motion under 300ms; the swipe verdict (hold 650ms, fly
  600ms) is deliberately slower because it must be read.
- `prefers-reduced-motion`: Lenis, pinning and parallax switch off (`useMotion().reduced`), the film stacks, fades stay.
- Every GSAP block lives in `useGSAP` with a scope so it cleans up on unmount; `gsap.matchMedia` gates motion tiers.

## Mobile baseline
`viewport-fit=cover`, `interactive-widget=resizes-content`, theme-color = limestone, tap highlight off, 16px inputs on coarse pointers, `touch-action: manipulation` on controls, hover styles gated by Tailwind's `hover:` (hover-capable only). Carousels use native scroll-snap. Tap targets ≥ 40px.

## Writing
Plain, specific, sentence case. Name the place and the thing ("Alfama apartment with a terrace over the Tejo"), not the category. Buttons say what happens ("Ask about this home"). Sample data is labelled as sample.
