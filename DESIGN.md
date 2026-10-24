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
- Photos are the material: 4:5 cards, 16:11 features, gradients from `ink` to transparent for legibility.

## Motion
- One orchestrated moment per page: the landing's hero rises in once (headline → copy → first cards, 70ms stagger). Nothing else auto-animates.
- User-triggered motion only otherwise: filter re-sorts via View Transitions, the detail sheet via `@starting-style`, press feedback `scale(0.97–0.985)` at 100–160ms.
- Curves from the tokens: `--ease-out-strong` for entrances, `--ease-in-out-strong` for on-screen movement. UI motion under 300ms; the swipe verdict (hold 650ms, fly 600ms) is deliberately slower because it must be read.
- `prefers-reduced-motion`: keep fades, drop movement (already in `globals.css`).

## Mobile baseline
`viewport-fit=cover`, `interactive-widget=resizes-content`, theme-color = limestone, tap highlight off, 16px inputs on coarse pointers, `touch-action: manipulation` on controls, hover styles gated by Tailwind's `hover:` (hover-capable only). Carousels use native scroll-snap. Tap targets ≥ 40px.

## Writing
Plain, specific, sentence case. Name the place and the thing ("Alfama apartment with a terrace over the Tejo"), not the category. Buttons say what happens ("Ask about this home"). Sample data is labelled as sample.
