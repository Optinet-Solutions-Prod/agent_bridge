/**
 * Seeds the Portugal demo: six agencies, the 21 showcase homes as their live
 * listings, buyer briefs, and some "Interested!" swipes so matches show.
 *
 *   node scripts/seed-demo.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY from .env (never
 * ship the service key to the browser). Safe to re-run: demo agents are reused,
 * their listings and briefs are replaced, and the anonymous codes are pinned so
 * the landing page's "Listing Agent #PT…" labels match real accounts. Every
 * demo login uses the password below.
 *
 * Needs Node 22.6+ (imports the TypeScript showcase data directly).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SHOWCASE } from "../src/data/portugal-showcase.ts";

const DEMO_PASSWORD = "Demo123456";
const ADMIN_EMAIL = "admin@optinetsolutions.com";
const GUEST_EMAIL = "guest@example.com";

// ---------------------------------------------------------------- env + http

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function api(path, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: prefer ? { ...headers, Prefer: prefer } : headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return data;
}
const rest = (path, opts) => api(`/rest/v1${path}`, { prefer: "return=representation", ...opts });

// -------------------------------------------------------------------- agents

/** anon_code is pinned to the agency code used in src/data/portugal-showcase.ts. */
const AGENTS = [
  { email: "ines.carvalho@example.com", full_name: "Inês Carvalho", agency_name: "Carvalho & Sousa Imobiliária", phone: "+351 912 345 678", license_no: "AMI 14021", plan: "agency", verified: true, anon_code: "PT21184" },
  { email: "tiago.ferreira@example.com", full_name: "Tiago Ferreira", agency_name: "Atlântico Properties", phone: "+351 913 456 789", license_no: "AMI 11873", plan: "agency", verified: true, anon_code: "PT18833" },
  { email: "rita.almeida@example.com", full_name: "Rita Almeida", agency_name: "Comporta Living", phone: "+351 914 567 890", license_no: "AMI 16118", plan: "pro", verified: true, anon_code: "PT61175" },
  { email: "joao.pinto@example.com", full_name: "João Pinto", agency_name: "Douro Estates", phone: "+351 915 678 901", license_no: "AMI 9731", plan: "free", verified: true, anon_code: "PT27306" },
  { email: "sofia.mendes@example.com", full_name: "Sofia Mendes", agency_name: "Costa Sul Properties", phone: "+351 916 789 012", license_no: "AMI 12604", plan: "pro", verified: true, anon_code: "PT70044" },
  { email: "miguel.santos@example.com", full_name: "Miguel Santos", agency_name: "Ilha Homes", phone: "+351 917 890 123", license_no: "AMI 13982", plan: "free", verified: false, anon_code: "PT90512" },
];
const GUEST = { email: GUEST_EMAIL, full_name: "Guest Agent", agency_name: "Demo Agency", phone: null, license_no: null, plan: "agency", verified: false };

/** Demo accounts from the earlier Malta seed; removed on sight (their data cascades). */
const LEGACY_EMAILS = [
  "maria.borg@example.com",
  "matthew.spiteri@example.com",
  "jeanpaul.zammit@example.com",
  "daniela.vella@example.com",
  "luke.camilleri@example.com",
  "sarah.grech@example.com",
];

// -------------------------------------------------------- private details

const STREETS = {
  Lisboa: ["Rua de São Miguel", "Calçada da Graça", "Rua da Escola Politécnica", "Travessa da Queimada", "Rua de São Bento"],
  Cascais: ["Avenida Nossa Senhora do Cabo", "Rua de Birre", "Estrada do Guincho", "Rua das Flores"],
  Sintra: ["Estrada da Praia das Maçãs", "Rua da Vinha"],
  Comporta: ["Estrada Nacional 261", "Rua dos Pinheiros", "Caminho das Dunas"],
  Alentejo: ["Herdade da Mata", "Rua de São Manços", "Travessa das Oliveiras"],
  Porto: ["Cais da Ribeira", "Rua do Passeio Alegre", "Avenida da República"],
  Algarve: ["Estrada do Farol", "Rua Dom Sebastião", "Avenida André Jordan", "Rua da Liberdade"],
  Madeira: ["Caminho do Lombo", "Rua da Carreira", "Estrada da Calheta"],
};
const NOTES = ["Keys at the office; any weekday.", "Owner-occupied; 24h notice.", "Tenanted; weekends only.", "Vacant; lockbox on site.", "Show flat open daily 10–18h."];
const privateFor = (home, i) => {
  const streets = STREETS[home.district] ?? ["Rua Principal"];
  const street = streets[i % streets.length];
  const isFlat = /Apartment|Penthouse|Duplex/.test(home.type);
  return {
    address_line: isFlat ? `${street}, ${10 + ((i * 7) % 80)}, ${1 + (i % 5)}º ${i % 2 ? "Esq." : "Dto."}` : `${street}, ${10 + ((i * 7) % 80)}`,
    street,
    block_or_building: isFlat ? `Edifício ${["Tejo", "Atlântico", "Sol", "Mar", "Serra"][i % 5]}` : null,
    viewing_notes: NOTES[i % NOTES.length],
    internal_notes: i % 3 === 0 ? "Owner flexible on completion date." : null,
  };
};

// ------------------------------------------------------------------- briefs

const REQUESTS = {
  "ines.carvalho@example.com": [
    { title: "Relocating family: 3–4 bed with outdoor space, Lisboa or Cascais, up to €1.6M", property_types: ["Apartment", "Townhouse", "House"], localities: ["Lapa", "Estrela", "Restelo", "Príncipe Real", "Cascais", "Estoril"], min_price: 800000, max_price: 1600000, min_bedrooms: 3, min_size_sqm: 150, must_have_features: ["Terrace"], notes: "Arriving in September; two children at an international school. Parking matters." },
  ],
  "tiago.ferreira@example.com": [
    { title: "Investor seeking 1–2 bed rental apartment in central Lisboa under €600k", property_types: ["Apartment"], localities: ["Alfama", "Graça", "Chiado", "Príncipe Real", "Bairro Alto", "Avenidas Novas"], min_price: null, max_price: 600000, min_bedrooms: 1, min_size_sqm: null, must_have_features: [], notes: "Cash. Will consider two units. Short-let licence a plus." },
  ],
  "rita.almeida@example.com": [
    { title: "Couple from Paris want a quinta or monte with pool, Alentejo or Sintra, €900k–€2M", property_types: ["Quinta", "Farmhouse", "House"], localities: ["Montemor-o-Novo", "Évora", "Colares", "Melides", "Grândola", "Arraiolos"], min_price: 900000, max_price: 2000000, min_bedrooms: 4, min_size_sqm: 220, must_have_features: ["Pool"], notes: "Want land and quiet. Flexible timing, serious buyers." },
  ],
  "joao.pinto@example.com": [
    { title: "Young family: 3-bed with parking in Porto or Gaia, up to €650k", property_types: ["Apartment", "Townhouse"], localities: ["Porto", "Foz do Douro", "Boavista", "Vila Nova de Gaia", "Matosinhos"], min_price: null, max_price: 650000, min_bedrooms: 3, min_size_sqm: 110, must_have_features: ["Parking"], notes: "Mortgage pre-approved. Would like a balcony or small terrace." },
  ],
  "sofia.mendes@example.com": [
    { title: "Retirees: villa with pool near Lagos or Carvoeiro, up to €1.5M", property_types: ["Villa", "House"], localities: ["Lagos", "Praia da Luz", "Carvoeiro", "Portimão", "Sagres"], min_price: 600000, max_price: 1500000, min_bedrooms: 3, min_size_sqm: null, must_have_features: ["Pool"], notes: "Single level preferred; sea view is the dream. Buying this winter." },
  ],
  [ADMIN_EMAIL]: [
    { title: "Client: 3–4 bed family home around Lisboa and Cascais, €700k–€1.8M", property_types: [], localities: ["Alfama", "Príncipe Real", "Lapa", "Estrela", "Restelo", "Cascais", "Estoril", "Birre", "Guincho", "Colares"], min_price: 700000, max_price: 1800000, min_bedrooms: 3, min_size_sqm: null, must_have_features: [], notes: "Young family, two kids. Needs outdoor space or a terrace. Pre-approved mortgage." },
  ],
};

// Who already swiped "Interested!" on what: [liker email, listing title].
const LIKES = [
  ["ines.carvalho@example.com", "Architect's villa above Guincho beach"],
  ["joao.pinto@example.com", "Architect's villa above Guincho beach"],
  ["sofia.mendes@example.com", "Beach house among the pines in Carvalhal"],
  ["miguel.santos@example.com", "Beach house among the pines in Carvalhal"],
  ["ines.carvalho@example.com", "Beach house among the pines in Carvalhal"],
  ["tiago.ferreira@example.com", "Minimalist house on the Lagos clifftops"],
  ["rita.almeida@example.com", "Alfama apartment with a terrace over the Tejo"],
  ["joao.pinto@example.com", "Alfama apartment with a terrace over the Tejo"],
  ["tiago.ferreira@example.com", "Monte with pool under the cork oaks"],
  ["sofia.mendes@example.com", "Riverside apartment in a restored Ribeira building"],
  ["rita.almeida@example.com", "Whitewashed villa with sea views above Carvoeiro"],
  ["miguel.santos@example.com", "Family villa with a heated pool in Birre"],
];
// Every listing the admin owns gets interest from these two demo agents.
const ADMIN_LIKERS = ["ines.carvalho@example.com", "tiago.ferreira@example.com"];

// ------------------------------------------------------------------- steps

async function listUsers() {
  const data = await api(`/auth/v1/admin/users?page=1&per_page=1000`);
  return data.users ?? [];
}

async function ensureUser(a, users) {
  const existing = users.find((u) => u.email?.toLowerCase() === a.email.toLowerCase());
  if (existing) {
    console.log(`  reusing  ${a.email}`);
    return existing.id;
  }
  const u = await api("/auth/v1/admin/users", {
    method: "POST",
    body: { email: a.email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: a.full_name, agency_name: a.agency_name, phone: a.phone } },
  });
  console.log(`  created  ${a.email}`);
  return u.id;
}

async function main() {
  console.log("Seeding the Portugal demo into", URL);
  let users = await listUsers();

  // Legacy Malta demo accounts go (listings, swipes and chats cascade with them).
  for (const email of LEGACY_EMAILS) {
    const u = users.find((x) => x.email?.toLowerCase() === email);
    if (u) {
      await api(`/auth/v1/admin/users/${u.id}`, { method: "DELETE" });
      console.log(`  removed  ${email}`);
    }
  }
  users = await listUsers();

  // Admin: unlimited listings + verified so the demo isn't blocked by the free limit.
  const admin = users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);
  if (admin) {
    await rest(`/agents?id=eq.${admin.id}`, { method: "PATCH", body: { plan: "agency", verified: true } });
    console.log(`  admin    ${ADMIN_EMAIL} -> agency plan`);
  }

  const ids = {};
  for (const a of [GUEST, ...AGENTS]) {
    const id = await ensureUser(a, users);
    ids[a.email] = id;
    const patch = { plan: a.plan, verified: a.verified };
    if (a.anon_code) patch.anon_code = a.anon_code;
    await rest(`/agents?id=eq.${id}`, { method: "PATCH", body: patch });
    await rest(`/agent_identities?agent_id=eq.${id}`, { method: "PATCH", body: { full_name: a.full_name, agency_name: a.agency_name, phone: a.phone, license_no: a.license_no } });
  }
  if (admin) ids[ADMIN_EMAIL] = admin.id;

  // Any remaining Malta-era codes (admin, guest) keep their digits with a PT prefix.
  const agents = await rest(`/agents?select=id,anon_code&anon_code=like.MT*`);
  for (const a of agents) {
    await rest(`/agents?id=eq.${a.id}`, { method: "PATCH", body: { anon_code: "PT" + a.anon_code.slice(2) } });
    console.log(`  recoded  ${a.anon_code} -> PT${a.anon_code.slice(2)}`);
  }

  // Listings: the showcase homes, owned by the agency whose code they carry.
  const byCode = Object.fromEntries(AGENTS.map((a) => [a.anon_code, a.email]));
  const grouped = {};
  for (const home of SHOWCASE) {
    const email = byCode[home.agency];
    if (!email) throw new Error(`No demo agent for agency code ${home.agency} (${home.title})`);
    (grouped[email] ??= []).push(home);
  }
  const listingIdByTitle = {};
  let n = 0;
  for (const [email, homes] of Object.entries(grouped)) {
    const agentId = ids[email];
    await rest(`/listings?agent_id=eq.${agentId}`, { method: "DELETE", prefer: "return=minimal" });
    const rows = homes.map((h) => ({
      agent_id: agentId,
      title: h.title,
      property_type: h.type,
      status: "active",
      price: h.price,
      currency: "EUR",
      bedrooms: h.beds,
      bathrooms: h.baths,
      size_sqm: h.sqm,
      outdoor_sqm: h.plotSqm ?? null,
      locality: h.locality,
      region: h.district,
      features: h.features,
      description: h.blurb,
      photo_urls: h.photos,
      buyer_agent_commission_pct: h.commissionPct,
    }));
    const inserted = await rest("/listings", { method: "POST", body: rows });
    inserted.forEach((row, i) => (listingIdByTitle[homes[i].title] = row.id));
    await rest("/listing_private", { method: "POST", body: inserted.map((row, i) => ({ listing_id: row.id, ...privateFor(homes[i], n + i) })), prefer: "return=minimal" });
    n += inserted.length;
    console.log(`  ${inserted.length} listings for ${email}`);
  }

  // The admin's own test listing, if it still points at a Malta town, moves to Estoril.
  if (admin) {
    const mine = await rest(`/listings?agent_id=eq.${admin.id}&select=id,title,locality`);
    const known = new Set(SHOWCASE.map((h) => h.locality));
    for (const l of mine) {
      if (!known.has(l.locality) && !/^(Cascais|Estoril|Lisboa|Porto|Lagos)$/.test(l.locality)) {
        await rest(`/listings?id=eq.${l.id}`, { method: "PATCH", body: { locality: "Estoril", region: "Cascais" }, prefer: "return=minimal" });
        console.log(`  moved    "${l.title}" from ${l.locality} to Estoril, Cascais`);
      }
    }
  }

  // Buyer briefs: replace the demo-seeded ones (same titles), never the user's own.
  for (const email of Object.keys(REQUESTS)) {
    const agentId = ids[email];
    if (!agentId) continue;
    await rest(`/buyer_requests?agent_id=eq.${agentId}`, { method: "DELETE", prefer: "return=minimal" });
    await rest("/buyer_requests", { method: "POST", body: REQUESTS[email].map((r) => ({ ...r, agent_id: agentId, status: "active" })), prefer: "return=minimal" });
    console.log(`  ${REQUESTS[email].length} buyer brief(s) for ${email}`);
  }

  // "Interested!" swipes (needs migration 0002). Upsert so re-runs are clean.
  const likeRows = LIKES.map(([liker, title]) => ({ agent_id: ids[liker], listing_id: listingIdByTitle[title], decision: "like" })).filter((r) => r.agent_id && r.listing_id);
  if (admin) {
    const adminListings = await rest(`/listings?agent_id=eq.${admin.id}&select=id`);
    for (const l of adminListings) for (const liker of ADMIN_LIKERS) likeRows.push({ agent_id: ids[liker], listing_id: l.id, decision: "like" });
  }
  try {
    await rest("/listing_swipes?on_conflict=agent_id,buyer_request_id,listing_id", { method: "POST", body: likeRows, prefer: "resolution=merge-duplicates,return=minimal" });
    console.log(`  ${likeRows.length} "Interested!" swipes seeded`);
  } catch (e) {
    console.warn("  skipped swipes — run supabase/migrations/0002_swipes.sql first:", String(e.message).slice(0, 120));
  }

  console.log("\nDone. Demo logins (password for all: %s):", DEMO_PASSWORD);
  for (const a of [GUEST, ...AGENTS]) console.log(`  ${a.email.padEnd(32)} ${(a.anon_code ?? "").padEnd(8)} ${a.agency_name} (${a.plan})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
