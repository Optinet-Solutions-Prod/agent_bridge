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

/** Seeded by scripts/seed-demo.mjs; anon codes match the agencies on the landing page. */
export const DEMO_AGENTS = [
  { email: GUEST_EMAIL, name: "Guest Agent", agency: "Demo Agency" },
  { email: "ines.carvalho@example.com", name: "Inês Carvalho", agency: "Carvalho & Sousa Imobiliária" },
  { email: "tiago.ferreira@example.com", name: "Tiago Ferreira", agency: "Atlântico Properties" },
  { email: "rita.almeida@example.com", name: "Rita Almeida", agency: "Comporta Living" },
  { email: "joao.pinto@example.com", name: "João Pinto", agency: "Douro Estates" },
  { email: "sofia.mendes@example.com", name: "Sofia Mendes", agency: "Costa Sul Properties" },
  { email: "miguel.santos@example.com", name: "Miguel Santos", agency: "Ilha Homes" },
] as const;

export type DemoAgent = (typeof DEMO_AGENTS)[number];

export function demoAgentFor(email: string | null | undefined): DemoAgent | null {
  if (!email) return null;
  return DEMO_AGENTS.find((a) => a.email === email.toLowerCase()) ?? null;
}
