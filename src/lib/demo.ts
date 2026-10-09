/**
 * Demo mode: no login required. Visitors hitting an app page without a
 * session are signed in as a shared guest agent, and anyone can switch to one
 * of the seeded demo agents to try the two-sided flows. Set
 * NEXT_PUBLIC_DEMO_MODE=false to require real logins again.
 *
 * Safe for client bundles — no secrets here (see demo-server.ts).
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export const GUEST_EMAIL = "guest@example.com";

export const DEMO_AGENTS = [
  { email: GUEST_EMAIL, name: "Guest Agent", agency: "Demo Agency" },
  { email: "maria.borg@example.com", name: "Maria Borg", agency: "Harbour Homes Malta" },
  { email: "matthew.spiteri@example.com", name: "Matthew Spiteri", agency: "Prime Residences" },
  { email: "jeanpaul.zammit@example.com", name: "Jean-Paul Zammit", agency: "Zammit & Co Estates" },
  { email: "daniela.vella@example.com", name: "Daniela Vella", agency: "Coastline Property" },
  { email: "luke.camilleri@example.com", name: "Luke Camilleri", agency: "Camilleri Realty" },
  { email: "sarah.grech@example.com", name: "Sarah Grech", agency: "Gozo Living" },
] as const;

export type DemoAgent = (typeof DEMO_AGENTS)[number];

export function demoAgentFor(email: string | null | undefined): DemoAgent | null {
  if (!email) return null;
  return DEMO_AGENTS.find((a) => a.email === email.toLowerCase()) ?? null;
}
