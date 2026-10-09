/**
 * Seeds demo agents, listings and buyer requests so the network looks alive.
 *
 *   node scripts/seed-demo.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY from .env (never
 * ship the service key to the browser). Safe to re-run: demo agents are reused
 * and their listings/requests are replaced. Every demo login uses the password
 * below so you can open two browsers and try the full two-sided flow.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEMO_PASSWORD = "Demo123456";
const ADMIN_EMAIL = "admin@optinetsolutions.com";

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

// ------------------------------------------------------------------- photos
// Unsplash photo ids verified to resolve. Exteriors first, then interiors.

const EXTERIOR = [
  "1613490493576-7fde63acd811", "1512917774080-9991f1c4c750", "1600596542815-ffad4c1539a9", "1600585154340-be6161a56a0c",
  "1564013799919-ab600027ffc6", "1570129477492-45c003edd2be", "1580587771525-78b9dba3b914", "1568605114967-8130f3a36994",
  "1523217582562-09d0def993a6", "1576941089067-2de3c901e126", "1507089947368-19c1da9775ae", "1600047509807-ba8f99d2cdde",
  "1600489000022-c2086d79f9d4", "1613977257363-707ba9348227", "1600563438938-a9a27216b4f5", "1502005229762-cf1b2da7c5d6",
  "1536376072261-38c75010e6c9",
];
const INTERIOR = [
  "1600607687939-ce8a6c25118c", "1600566753086-00f18fb6b3ea", "1600210492486-724fe5c67fb0", "1600573472550-8090b5e0745e",
  "1600585152220-90363fe7e115", "1522708323590-d24dbb6b0267", "1502672260266-1c1ef2d93688", "1484154218962-a197022b5858",
  "1556228453-efd6c1ff04f6", "1560448204-e02f11c3d0e2", "1540518614846-7eded433c457", "1505693416388-ac5ce068fe85",
  "1556911220-bff31c812dba", "1588880331179-bc9b93a8cb5e", "1515263487990-61b07816b324", "1512918728675-ed5a9ecdebfd",
  "1554995207-c18c203602cb", "1600047509358-9dc75507daeb", "1600121848594-d8644e57abab", "1600607686527-6fb886090705",
  "1600607688969-a5bfcd646154", "1600566752355-35792bedcfea", "1600585153490-76fb20a32601", "1600566753190-17f0baa2a6c3",
  "1600607687644-c7171b42498f", "1600585154526-990dced4db0d", "1600047508788-786f3865b4b9", "1600210491892-03d54c0aaf87",
  "1600573472591-ee6b68d14c68", "1583608205776-bfd35f0d9f83", "1605276374104-dee2a0ed3cd6", "1605146769289-440113cc3d00",
  "1586023492125-27b2c045efd7", "1598928506311-c55ded91a20c", "1600047509782-20d39509f26d", "1599809275671-b5942cabc7a2",
  "1600585154084-4e5fe7c39198", "1600210492493-0946911123ea", "1600607687920-4e2a09cf159d", "1600585154363-67eb9e2e2099",
  "1560184897-ae75f418493e", "1565182999561-18d7dc61c393", "1574362848149-11496d93a7c7", "1549517045-bc93de075e53",
  "1574691250077-03a929faece5", "1559599238-308793637427",
];
const OFFICE = ["1497366754035-f200968a6e72"];

const photo = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
let ext = 0;
let int = 0;
const nextExterior = () => photo(EXTERIOR[ext++ % EXTERIOR.length]);
const nextInterior = () => photo(INTERIOR[int++ % INTERIOR.length]);
/** n photos: an exterior first for houses, interiors for the rest. */
function photos(kind, n) {
  const out = [];
  if (kind === "office") out.push(photo(OFFICE[0]));
  else if (kind === "house") out.push(nextExterior());
  while (out.length < n) out.push(nextInterior());
  return out;
}

// -------------------------------------------------------------------- data

const AGENTS = [
  {
    // Demo mode signs anonymous visitors in as this account (src/lib/demo.ts).
    email: "guest@example.com", full_name: "Guest Agent", agency_name: "Demo Agency", phone: null,
    license_no: null, plan: "agency", verified: false,
  },
  {
    email: "maria.borg@example.com", full_name: "Maria Borg", agency_name: "Harbour Homes Malta", phone: "+356 7912 3456",
    license_no: "MT-REA-1042", plan: "agency", verified: true,
  },
  {
    email: "matthew.spiteri@example.com", full_name: "Matthew Spiteri", agency_name: "Prime Residences", phone: "+356 7923 4567",
    license_no: "MT-REA-1187", plan: "agency", verified: true,
  },
  {
    email: "jeanpaul.zammit@example.com", full_name: "Jean-Paul Zammit", agency_name: "Zammit & Co Estates", phone: "+356 7934 5678",
    license_no: "MT-REA-0931", plan: "pro", verified: true,
  },
  {
    email: "daniela.vella@example.com", full_name: "Daniela Vella", agency_name: "Coastline Property", phone: "+356 7945 6789",
    license_no: "MT-REA-1260", plan: "pro", verified: true,
  },
  {
    email: "luke.camilleri@example.com", full_name: "Luke Camilleri", agency_name: "Camilleri Realty", phone: "+356 7956 7890",
    license_no: "MT-REA-1312", plan: "free", verified: false,
  },
  {
    email: "sarah.grech@example.com", full_name: "Sarah Grech", agency_name: "Gozo Living", phone: "+356 7967 8901",
    license_no: "MT-REA-1398", plan: "free", verified: false,
  },
];

// kind: "house" => exterior photo first, "flat" => interiors only.
const LISTINGS = {
  "maria.borg@example.com": [
    { kind: "flat", title: "Seafront 3-bed apartment with wraparound terrace", property_type: "Apartment", locality: "Sliema", region: "Northern Harbour", price: 1150000, bedrooms: 3, bathrooms: 2, size_sqm: 165, outdoor_sqm: 40, features: ["Sea view", "Terrace", "Lift", "Highly finished", "Parking"], buyer_agent_commission_pct: 2.5, description: "Front-line apartment on the Sliema seafront with uninterrupted views across to Valletta. Open-plan living flows onto a wraparound terrace; three double bedrooms, two bathrooms, lift and underlying garage space.", photos: 5, priv: { address_line: "Apt 7, The Strand Residence", street: "The Strand", block_or_building: "The Strand Residence", viewing_notes: "Tenanted until end of month; 24h notice." } },
    { kind: "flat", title: "Designer penthouse overlooking Marsamxett", property_type: "Penthouse", locality: "Gżira", region: "Northern Harbour", price: 985000, bedrooms: 3, bathrooms: 2, size_sqm: 150, outdoor_sqm: 80, features: ["Sea view", "Terrace", "Lift", "Airspace", "Furnished"], buyer_agent_commission_pct: 3, description: "Fully furnished penthouse with an 80 m² terrace facing the harbour and Manoel Island. Includes airspace and two-car garage.", photos: 4, priv: { address_line: "Penthouse, Marina Court", street: "Triq ix-Xatt", block_or_building: "Marina Court", viewing_notes: "Owner-occupied; evenings preferred." } },
    { kind: "house", title: "Converted townhouse with courtyard", property_type: "Townhouse", locality: "Valletta", region: "Southern Harbour", price: 1450000, bedrooms: 4, bathrooms: 3, size_sqm: 240, outdoor_sqm: 35, features: ["Terrace", "Highly finished", "Home office"], buyer_agent_commission_pct: 2, description: "Sensitively restored 17th-century townhouse over four floors with original stone features, internal courtyard and roof terrace with harbour views.", photos: 4, priv: { address_line: "No. 42", street: "Triq San Pawl", block_or_building: null, viewing_notes: "Keys with office; any time." } },
    { kind: "flat", title: "Two-bed apartment steps from the promenade", property_type: "Apartment", locality: "Sliema", region: "Northern Harbour", price: 520000, bedrooms: 2, bathrooms: 1, size_sqm: 95, outdoor_sqm: null, features: ["Lift", "Furnished"], buyer_agent_commission_pct: 2.5, description: "Well-kept second-floor apartment in a small block, 100 m from the sea. Ideal lock-up-and-leave or rental investment.", photos: 3, priv: { address_line: "Flat 4, Sea Breeze Court", street: "Triq Dingli", block_or_building: "Sea Breeze Court", viewing_notes: "Vacant." } },
    { kind: "house", title: "Family maisonette with garden and garage", property_type: "Maisonette", locality: "Swieqi", region: "Northern Harbour", price: 780000, bedrooms: 4, bathrooms: 2, size_sqm: 185, outdoor_sqm: 90, features: ["Garden", "Garage", "Pet friendly", "Home office"], buyer_agent_commission_pct: 2.5, description: "Ground-floor maisonette with a private 90 m² garden, four bedrooms, study and a two-car garage. Quiet residential street close to schools.", photos: 4, priv: { address_line: "Maisonette 1, Villa Rosa", street: "Triq il-Ġilju", block_or_building: "Villa Rosa", viewing_notes: "Family home; weekends only." } },
  ],
  "matthew.spiteri@example.com": [
    { kind: "house", title: "Contemporary villa with infinity pool", property_type: "Villa", locality: "Madliena", region: "Northern Harbour", price: 2400000, bedrooms: 5, bathrooms: 4, size_sqm: 420, outdoor_sqm: 350, features: ["Pool", "Sea view", "Garden", "Garage", "Highly finished"], buyer_agent_commission_pct: 2, description: "Architect-designed villa on the Madliena ridge with an infinity pool and open sea views from every level. Five en-suite bedrooms, home cinema and four-car garage.", photos: 5, priv: { address_line: "Villa Serenity", street: "Triq il-Madliena", block_or_building: null, viewing_notes: "By appointment, proof of funds required." } },
    { kind: "house", title: "Four-bed villa with pool in quiet cul-de-sac", property_type: "Villa", locality: "Swieqi", region: "Northern Harbour", price: 1650000, bedrooms: 4, bathrooms: 3, size_sqm: 300, outdoor_sqm: 200, features: ["Pool", "Garden", "Garage", "Pet friendly"], buyer_agent_commission_pct: 2.5, description: "Detached villa on a corner plot with mature garden, heated pool and separate guest studio.", photos: 4, priv: { address_line: "Villa Mistral", street: "Triq il-Ħarruba", block_or_building: null, viewing_notes: "Owners abroad; keys with us." } },
    { kind: "flat", title: "Brand-new 3-bed with sea glimpses", property_type: "Apartment", locality: "St Julian's", region: "Northern Harbour", price: 695000, bedrooms: 3, bathrooms: 2, size_sqm: 130, outdoor_sqm: 20, features: ["New build", "Sea view", "Lift", "Parking"], buyer_agent_commission_pct: 3, description: "Finished to a high standard in a new boutique block. Sea glimpses from the front balcony, optional garage at €35k.", photos: 4, priv: { address_line: "Apt 5, Portomaso View", street: "Triq Ball", block_or_building: "Portomaso View", viewing_notes: "Show flat open daily." } },
    { kind: "house", title: "Garden maisonette in sought-after Attard", property_type: "Maisonette", locality: "Attard", region: "Western", price: 640000, bedrooms: 3, bathrooms: 2, size_sqm: 160, outdoor_sqm: 120, features: ["Garden", "Garage", "Highly finished"], buyer_agent_commission_pct: 2.5, description: "Elevated ground-floor maisonette with a large landscaped garden and outdoor kitchen. Walking distance to San Anton Gardens.", photos: 4, priv: { address_line: "Maisonette, Ta' Qali Heights", street: "Triq in-Nutar Zarb", block_or_building: null, viewing_notes: "Weekdays after 4pm." } },
    { kind: "flat", title: "Bright 1-bed investment apartment", property_type: "Apartment", locality: "Msida", region: "Northern Harbour", price: 245000, bedrooms: 1, bathrooms: 1, size_sqm: 60, outdoor_sqm: null, features: ["Lift", "Furnished"], buyer_agent_commission_pct: 2.5, description: "Modern one-bedroom close to the University, currently let at €1,100/month. Sold furnished.", photos: 3, priv: { address_line: "Flat 12, Campus Court", street: "Triq il-Wied", block_or_building: "Campus Court", viewing_notes: "Tenant needs 48h notice." } },
  ],
  "jeanpaul.zammit@example.com": [
    { kind: "house", title: "House of character with pool in Naxxar", property_type: "House of Character", locality: "Naxxar", region: "Northern", price: 1250000, bedrooms: 4, bathrooms: 3, size_sqm: 280, outdoor_sqm: 180, features: ["Pool", "Garden", "Highly finished", "Garage"], buyer_agent_commission_pct: 2, description: "Converted farmhouse in the village core with vaulted ceilings, a sunny courtyard pool and a one-bedroom guest annex.", photos: 5, priv: { address_line: "Dar il-Ġnien", street: "Triq il-Parroċċa", block_or_building: null, viewing_notes: "Any day, call first." } },
    { kind: "flat", title: "Spacious 4-bed apartment with views of Mosta Dome", property_type: "Apartment", locality: "Mosta", region: "Northern", price: 430000, bedrooms: 4, bathrooms: 2, size_sqm: 175, outdoor_sqm: 25, features: ["Terrace", "Lift", "Parking"], buyer_agent_commission_pct: 2.5, description: "Large family apartment with four doubles, a separate dining room and a back terrace. Garage available.", photos: 4, priv: { address_line: "Apt 3, Rotunda Court", street: "Triq il-Kbira", block_or_building: "Rotunda Court", viewing_notes: "Vacant, keys at office." } },
    { kind: "flat", title: "Seafront 2-bed in St Paul's Bay", property_type: "Apartment", locality: "St Paul's Bay", region: "Northern", price: 365000, bedrooms: 2, bathrooms: 1, size_sqm: 90, outdoor_sqm: 15, features: ["Sea view", "Lift", "Furnished"], buyer_agent_commission_pct: 3, description: "Direct sea views over the bay from the living room and front bedroom. Furnished and ready to move in.", photos: 3, priv: { address_line: "Flat 9, Bayview Mansions", street: "Triq il-Mosta", block_or_building: "Bayview Mansions", viewing_notes: "Holiday let in summer." } },
    { kind: "flat", title: "Modern 3-bed penthouse in Mellieħa", property_type: "Penthouse", locality: "Mellieħa", region: "Northern", price: 575000, bedrooms: 3, bathrooms: 2, size_sqm: 140, outdoor_sqm: 70, features: ["Sea view", "Terrace", "Airspace", "New build"], buyer_agent_commission_pct: 2.5, description: "Top-floor penthouse with a 70 m² terrace looking over Mellieħa Bay. Airspace included.", photos: 4, priv: { address_line: "Penthouse, Għadira Heights", street: "Triq il-Mellieħa", block_or_building: "Għadira Heights", viewing_notes: "Any time." } },
  ],
  "daniela.vella@example.com": [
    { kind: "flat", title: "Marsaskala 3-bed with large terrace", property_type: "Apartment", locality: "Marsaskala", region: "South Eastern", price: 335000, bedrooms: 3, bathrooms: 2, size_sqm: 125, outdoor_sqm: 40, features: ["Terrace", "Sea view", "Lift"], buyer_agent_commission_pct: 2.5, description: "Bright apartment with side sea views and a terrace big enough for dining. Two bathrooms, lift and optional garage.", photos: 4, priv: { address_line: "Flat 6, Marina Heights", street: "Triq is-Salini", block_or_building: "Marina Heights", viewing_notes: "Vacant." } },
    { kind: "house", title: "Terraced house near Marsaxlokk harbour", property_type: "Terraced House", locality: "Marsaxlokk", region: "South Eastern", price: 495000, bedrooms: 3, bathrooms: 2, size_sqm: 200, outdoor_sqm: 60, features: ["Garage", "Terrace", "Pet friendly"], buyer_agent_commission_pct: 2.5, description: "Three-storey terraced house with a roof terrace overlooking the fishing harbour and a street-level garage.", photos: 4, priv: { address_line: "No. 18", street: "Triq il-Knisja", block_or_building: null, viewing_notes: "Owner at home mornings." } },
    { kind: "flat", title: "Shell-form duplex penthouse in Żejtun", property_type: "Penthouse", locality: "Żejtun", region: "South Eastern", price: 280000, bedrooms: 3, bathrooms: 2, size_sqm: 150, outdoor_sqm: 60, features: ["Shell form", "Airspace", "New build"], buyer_agent_commission_pct: 3.5, description: "Duplex penthouse in shell form in a new block of six, ready for finishing to the buyer's taste. Completion Q2.", photos: 3, priv: { address_line: "Penthouse, Blk B", street: "Triq Luqa Briffa", block_or_building: "Block B", viewing_notes: "Site visits with developer." } },
    { kind: "house", title: "Renovated townhouse in Birżebbuġa", property_type: "Townhouse", locality: "Birżebbuġa", region: "South Eastern", price: 410000, bedrooms: 3, bathrooms: 2, size_sqm: 190, outdoor_sqm: 30, features: ["Terrace", "Home office"], buyer_agent_commission_pct: 2.5, description: "Fully renovated townhouse with original tiles, new kitchen and a sunny back yard. Five minutes from Pretty Bay.", photos: 4, priv: { address_line: "No. 7", street: "Triq il-Bajja s-Sabiħa", block_or_building: null, viewing_notes: "Keys at office." } },
  ],
  "luke.camilleri@example.com": [
    { kind: "office", title: "Executive office suite in Birkirkara", property_type: "Office", locality: "Birkirkara", region: "Northern Harbour", price: 390000, bedrooms: null, bathrooms: 1, size_sqm: 180, outdoor_sqm: null, features: ["Lift", "Parking", "Highly finished"], buyer_agent_commission_pct: 2, description: "Fitted-out 180 m² office on the second floor of a modern block with three parking spaces and a lift.", photos: 3, priv: { address_line: "Level 2, Business Centre", street: "Triq il-Wied", block_or_building: "Business Centre", viewing_notes: "Office hours." } },
    { kind: "flat", title: "2-bed apartment in Qormi, ideal first home", property_type: "Apartment", locality: "Qormi", region: "South Eastern", price: 215000, bedrooms: 2, bathrooms: 1, size_sqm: 85, outdoor_sqm: null, features: ["Lift"], buyer_agent_commission_pct: 2.5, description: "Well-presented two-bedroom apartment in a small block, close to amenities. Eligible for first-time buyer scheme.", photos: 3, priv: { address_line: "Flat 2, St Joseph Court", street: "Triq San Ġużepp", block_or_building: "St Joseph Court", viewing_notes: "Vacant." } },
    { kind: "house", title: "Plot with approved permits in Siġġiewi", property_type: "Plot", locality: "Siġġiewi", region: "Western", price: 320000, bedrooms: null, bathrooms: null, size_sqm: null, outdoor_sqm: 240, features: [], buyer_agent_commission_pct: 2, description: "240 m² plot with full permits for a three-storey terraced house plus basement garage. Services on site.", photos: 1, priv: { address_line: "Plot 5", street: "Triq il-Buskett", block_or_building: null, viewing_notes: "Open plot, visit freely." } },
  ],
  "sarah.grech@example.com": [
    { kind: "house", title: "Farmhouse with pool and country views", property_type: "Farmhouse", locality: "Għarb", region: "Gozo", price: 890000, bedrooms: 4, bathrooms: 3, size_sqm: 260, outdoor_sqm: 400, features: ["Pool", "Country view", "Garden", "Garage"], buyer_agent_commission_pct: 2.5, description: "Converted farmhouse with a large pool deck, mature gardens and uninterrupted country views towards Ta' Pinu.", photos: 5, priv: { address_line: "Razzett il-Qadim", street: "Triq il-Knisja", block_or_building: null, viewing_notes: "Weekends; ferry timing matters." } },
    { kind: "flat", title: "Seafront apartment in Marsalforn", property_type: "Apartment", locality: "Marsalforn", region: "Gozo", price: 295000, bedrooms: 2, bathrooms: 1, size_sqm: 95, outdoor_sqm: 20, features: ["Sea view", "Terrace", "Furnished"], buyer_agent_commission_pct: 3, description: "First-floor apartment right on the Marsalforn promenade with a front terrace facing the bay.", photos: 3, priv: { address_line: "Flat 3, Bayside Court", street: "Triq il-Port", block_or_building: "Bayside Court", viewing_notes: "Holiday let; check calendar." } },
    { kind: "house", title: "Converted house of character in Xagħra", property_type: "House of Character", locality: "Xagħra", region: "Gozo", price: 620000, bedrooms: 3, bathrooms: 2, size_sqm: 210, outdoor_sqm: 90, features: ["Garden", "Country view", "Highly finished"], buyer_agent_commission_pct: 2.5, description: "Beautifully converted village house with exposed stone, a courtyard garden and views over Ramla valley.", photos: 4, priv: { address_line: "Dar Ramla", street: "Triq Ġnien Xibla", block_or_building: null, viewing_notes: "Any day with notice." } },
  ],
};

const REQUESTS = {
  "maria.borg@example.com": [
    { title: "Expat couple seeking 2–3 bed with sea view, Sliema / St Julian's", property_types: ["Apartment", "Penthouse"], localities: ["Sliema", "St Julian's", "Gżira"], min_price: 500000, max_price: 900000, min_bedrooms: 2, min_size_sqm: null, must_have_features: ["Sea view"], notes: "Cash buyers, flexible on timing. Prefer lift and parking." },
  ],
  "jeanpaul.zammit@example.com": [
    { title: "Family relocating — 4-bed villa with pool, up to €1.8M", property_types: ["Villa", "House of Character"], localities: ["Swieqi", "Madliena", "Naxxar", "Attard"], min_price: 1000000, max_price: 1800000, min_bedrooms: 4, min_size_sqm: 250, must_have_features: ["Pool"], notes: "Moving in September. Need to be near international schools." },
  ],
  "daniela.vella@example.com": [
    { title: "Investor looking for 1–2 bed rental units under €300k", property_types: ["Apartment"], localities: [], min_price: null, max_price: 300000, min_bedrooms: 1, min_size_sqm: null, must_have_features: [], notes: "Will buy more than one. Furnished preferred." },
  ],
  "sarah.grech@example.com": [
    { title: "Retiring couple want farmhouse or house of character in Gozo", property_types: ["Farmhouse", "House of Character"], localities: ["Xagħra", "Għarb", "Nadur", "Victoria", "Sannat", "Munxar"], min_price: 500000, max_price: 900000, min_bedrooms: 3, min_size_sqm: null, must_have_features: [], notes: "Want outdoor space and quiet. No rush." },
  ],
  [ADMIN_EMAIL]: [
    { title: "Client: 3–4 bed family home in the north, €400k–€900k", property_types: [], localities: ["Swieqi", "St Julian's", "Sliema", "Gżira", "Mosta", "Naxxar", "Mellieħa", "St Paul's Bay"], min_price: 400000, max_price: 900000, min_bedrooms: 3, min_size_sqm: null, must_have_features: [], notes: "Young family, two kids. Needs outdoor space or a terrace. Pre-approved mortgage." },
  ],
};

// Who already swiped "Interested!" on what — makes the "more than one match"
// celebration and the owner-side interest counts visible in the demo.
// [liker email, owner email, listing title]
const LIKES = [
  ["maria.borg@example.com", "matthew.spiteri@example.com", "Brand-new 3-bed with sea glimpses"],
  ["jeanpaul.zammit@example.com", "matthew.spiteri@example.com", "Brand-new 3-bed with sea glimpses"],
  ["daniela.vella@example.com", "maria.borg@example.com", "Family maisonette with garden and garage"],
  ["matthew.spiteri@example.com", "maria.borg@example.com", "Family maisonette with garden and garage"],
  ["sarah.grech@example.com", "maria.borg@example.com", "Family maisonette with garden and garage"],
  ["luke.camilleri@example.com", "jeanpaul.zammit@example.com", "Modern 3-bed penthouse in Mellieħa"],
  ["maria.borg@example.com", "jeanpaul.zammit@example.com", "Spacious 4-bed apartment with views of Mosta Dome"],
  ["daniela.vella@example.com", "sarah.grech@example.com", "Farmhouse with pool and country views"],
  ["matthew.spiteri@example.com", "sarah.grech@example.com", "Farmhouse with pool and country views"],
  ["jeanpaul.zammit@example.com", "matthew.spiteri@example.com", "Contemporary villa with infinity pool"],
  ["luke.camilleri@example.com", "maria.borg@example.com", "Seafront 3-bed apartment with wraparound terrace"],
];
// Every listing the admin owns gets interest from these two demo agents.
const ADMIN_LIKERS = ["maria.borg@example.com", "daniela.vella@example.com"];

// ------------------------------------------------------------------- steps

async function findUserByEmail(email) {
  const data = await api(`/auth/v1/admin/users?page=1&per_page=1000`);
  return (data.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureUser(a) {
  try {
    const u = await api("/auth/v1/admin/users", {
      method: "POST",
      body: { email: a.email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: a.full_name, agency_name: a.agency_name, phone: a.phone } },
    });
    console.log(`  created  ${a.email}`);
    return u.id;
  } catch (e) {
    if (!String(e.message).includes("email_exists") && !String(e.message).includes("already been registered")) throw e;
    const u = await findUserByEmail(a.email);
    if (!u) throw e;
    console.log(`  reusing  ${a.email}`);
    return u.id;
  }
}

async function main() {
  console.log("Seeding demo data into", URL);

  // Admin: unlimited listings + verified so the demo isn't blocked by the free limit.
  const admin = await findUserByEmail(ADMIN_EMAIL);
  if (admin) {
    await rest(`/agents?id=eq.${admin.id}`, { method: "PATCH", body: { plan: "agency", verified: true } });
    console.log(`  admin    ${ADMIN_EMAIL} -> agency plan`);
  }

  const ids = {};
  for (const a of AGENTS) {
    const id = await ensureUser(a);
    ids[a.email] = id;
    await rest(`/agents?id=eq.${id}`, { method: "PATCH", body: { plan: a.plan, verified: a.verified } });
    await rest(`/agent_identities?agent_id=eq.${id}`, { method: "PATCH", body: { full_name: a.full_name, agency_name: a.agency_name, phone: a.phone, license_no: a.license_no } });
  }
  if (admin) ids[ADMIN_EMAIL] = admin.id;

  // Replace demo listings so re-running gives a clean set.
  const listingIdByTitle = {}; // `${owner email}|${title}` -> id
  for (const email of Object.keys(LISTINGS)) {
    const agentId = ids[email];
    await rest(`/listings?agent_id=eq.${agentId}`, { method: "DELETE", prefer: "return=minimal" });
    const rows = LISTINGS[email].map(({ kind, photos: n, priv, ...l }) => ({ ...l, agent_id: agentId, status: "active", currency: "EUR", photo_urls: photos(kind, n) }));
    const inserted = await rest("/listings", { method: "POST", body: rows });
    inserted.forEach((row, i) => (listingIdByTitle[`${email}|${LISTINGS[email][i].title}`] = row.id));
    const privRows = inserted.map((row, i) => ({ listing_id: row.id, ...LISTINGS[email][i].priv }));
    await rest("/listing_private", { method: "POST", body: privRows, prefer: "return=minimal" });
    console.log(`  ${inserted.length} listings for ${email}`);
  }

  // Seed "Interested!" swipes (needs migration 0002). Upsert so re-runs are clean.
  const likeRows = LIKES.map(([liker, owner, title]) => ({ agent_id: ids[liker], listing_id: listingIdByTitle[`${owner}|${title}`], decision: "like" })).filter((r) => r.agent_id && r.listing_id);
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

  for (const email of Object.keys(REQUESTS)) {
    const agentId = ids[email];
    if (!agentId) continue;
    // Only replace demo-seeded requests (same titles), never the user's own.
    const titles = REQUESTS[email].map((r) => r.title);
    await rest(`/buyer_requests?agent_id=eq.${agentId}&title=in.(${titles.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(",")})`, { method: "DELETE", prefer: "return=minimal" });
    await rest("/buyer_requests", { method: "POST", body: REQUESTS[email].map((r) => ({ ...r, agent_id: agentId, status: "active" })), prefer: "return=minimal" });
    console.log(`  ${REQUESTS[email].length} buyer request(s) for ${email}`);
  }

  console.log("\nDone. Demo logins (password for all: %s):", DEMO_PASSWORD);
  for (const a of AGENTS) console.log(`  ${a.email.padEnd(34)} ${a.agency_name} (${a.plan})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
