import "server-only";

/** Password shared by the seeded demo agents (scripts/seed-demo.mjs). Server-side only. */
export function demoPassword() {
  return process.env.DEMO_AGENT_PASSWORD ?? "Demo123456";
}
