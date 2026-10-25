# Ponte (formerly Ponte) — design system ("Lisbon light")

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
- The landing page is a deck of full-screen slides (`src/components/landing/cinematic/slides.tsx`, GSAP only, no
  smooth-scroll library): `html`/`body` are locked and show no scrollbars, each slide is exactly the viewport, and a wheel
  tick (48px within 220ms), a vertical swipe (44px), ArrowUp/Down, PageUp/Down, Space, Home/End or a side dot moves exactly
  one slide. The transition is a crossfade with the outgoing content easing 7% away and shrinking to 0.96 while the
  incoming content arrives from 9% the other way at 1.03 (0.95s, `power3.inOut`/`power3.out`), then a 500ms lock so a
  flick cannot skip slides. The header goes transparent over photographic and cobalt slides and solid limestone over
  light ones; its 2px line shows deck progress. Dots are hidden on phones (swipe is the gesture; the header line remains).
- Each slide owns one intro that replays every time it becomes active (`useSlideIntro`, reverted on leave): Ken Burns
  push-in and a masked word reveal on the hero; a push-in, copy rise and price count-up on every home slide; cards that
  slide in from the right and tilt in 3D under the pointer in the gallery; a map that draws itself with pulsing district
  dots and count-ups; the live swipe deck rising with a 3° settle; a connecting line that draws across the steps; a slow
  push-in on the closing photograph.
- Slides whose content is taller than the screen (map, agents and the gallery on short phones) scroll inside themselves;
  the deck only advances once that inner scroll has reached its end, so nothing is unreachable. Horizontal carousels,
  dialogs and the swipe deck's card drag (`data-no-slide`) never change slides.
- Inside the app: one orchestrated moment per screen at most; otherwise motion only answers a user action (filter
  re-sorts via View Transitions, sheets via `@starting-style`, press feedback `scale(0.97–0.985)` at 100–160ms).
- Curves: `power4.out` for entrances, `power3.inOut` for on-screen movement, `back.out(1.6)` for pops; CSS tokens
  `--ease-out-strong` / `--ease-in-out-strong` mirror them. UI motion under 300ms; the swipe verdict (hold 650ms, fly
  600ms) is deliberately slower because it must be read.
- `prefers-reduced-motion`: slides switch instantly and the per-slide intros are skipped (`useMotion().reduced`); press feedback stays.
- Every GSAP block lives in `useGSAP` with a scope so it cleans up on unmount or when its slide leaves.

## Mobile baseline
`viewport-fit=cover`, `interactive-widget=resizes-content`, theme-color = limestone, tap highlight off, 16px inputs on coarse pointers, `touch-action: manipulation` on controls, hover styles gated by Tailwind's `hover:` (hover-capable only). Carousels use native scroll-snap. Tap targets ≥ 40px.

## Writing
Plain, specific, sentence case. Name the place and the thing ("Alfama apartment with a terrace over the Tejo"), not the category. Buttons say what happens ("Ask about this home"). Sample data is labelled as sample.
