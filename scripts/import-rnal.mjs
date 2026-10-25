// Import the register sample collected by scripts/scrape-rnal.mjs.
//
//   node scripts/import-rnal.mjs [data/private/rnal-owners.json] [--dry-run]
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env and
// migration 0006_register_owners.sql applied. Upserts on the register number,
// so re-running after a bigger scrape just adds and refreshes rows.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) ?? "data/private/rnal-owners.json";
const dryRun = args.includes("--dry-run");

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env");

const records = JSON.parse(readFileSync(file, "utf8"));
const rentals = records.map((r) => {
  const first = r.operators[0] ?? {};
  return {
    rnal_nr: r.rnal_nr,
    name: r.name,
    modality: r.modality,
    guests: r.guests,
    rooms: r.rooms,
    beds: r.beds,
    parish: r.parish,
    municipality: r.municipality,
    district: r.district,
    postcode: r.postcode,
    registered_on: r.registered_on,
    opened_on: r.opened_on,
    operator_role: first.role_en ?? null,
    operator_kind: first.kind ?? null,
    operators: r.operators.length || 1,
    has_email: r.operators.some((o) => o.email),
    has_phone: r.operators.some((o) => o.phone),
    source_url: r.source_url,
    checked_on: r.checked_on,
  };
});
const contacts = records.map((r) => ({ rnal_nr: r.rnal_nr, address: r.address, operators: r.operators }));

const n = rentals.length;
const pct = (k) => `${Math.round((rentals.filter((r) => r[k]).length / Math.max(n, 1)) * 100)}%`;
console.log(`${n} rentals in ${file}: ${pct("has_email")} with email, ${pct("has_phone")} with phone`);
const roles = rentals.reduce((m, r) => ((m[r.operator_role ?? "?"] = (m[r.operator_role ?? "?"] ?? 0) + 1), m), {});
console.log("operator roles:", roles);
if (dryRun) process.exit(0);

const db = createClient(url, key, { auth: { persistSession: false } });
for (let i = 0; i < n; i += 200) {
  const { error } = await db.from("register_rentals").upsert(rentals.slice(i, i + 200), { onConflict: "rnal_nr" });
  if (error) throw new Error(`register_rentals: ${error.message}${error.code === "PGRST205" ? " (run supabase/migrations/0006_register_owners.sql first)" : ""}`);
  const { error: e2 } = await db.from("register_contacts").upsert(contacts.slice(i, i + 200), { onConflict: "rnal_nr" });
  if (e2) throw new Error(`register_contacts: ${e2.message}`);
}
const { count } = await db.from("register_rentals").select("*", { count: "exact", head: true });
console.log(`imported. register_rentals now holds ${count} rows.`);
