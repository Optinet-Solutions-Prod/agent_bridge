/**
 * Imports private-owner listings ("owner leads") from a spreadsheet into Supabase.
 *
 *   node scripts/import-owner-leads.mjs <file.xlsx|file.csv> [--sheet Leads] [--district Lisboa]
 *                                       [--checked-on 2026-10-24] [--platform OLX] [--dry-run]
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY from .env (the service key
 * never ships to the browser). Rows are upserted on (platform, listing_id), so re-importing
 * the same file is safe and newer files update prices in place.
 *
 * Known column names are mapped to typed fields; anything else is kept verbatim in the
 * `extra` JSON column, and the script prints what it mapped so new feeds can be checked.
 * A sheet named "Summary" with a "Checked on" row sets source_checked_on when --checked-on
 * is not given.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import XLSX from "xlsx";

// ---------------------------------------------------------------- args + env

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const DRY = args.includes("--dry-run");
if (!file) {
  console.error("Usage: node scripts/import-owner-leads.mjs <file.xlsx|csv> [--sheet NAME] [--district Lisboa] [--checked-on YYYY-MM-DD] [--platform OLX] [--dry-run]");
  process.exit(1);
}

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
if (!DRY && (!URL || !KEY)) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

// ------------------------------------------------------------- header mapping

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** normalised header -> field. Exact matches only; unknown headers land in `extra`. */
const HEADERS = {
  platform: ["platform", "source", "portal", "site"],
  listing_id: ["listingid", "id", "listing", "adid", "anuncioid", "reference", "ref"],
  offer: ["offer", "deal", "transaction", "negocio", "tipodenegocio", "operation"],
  typology: ["type", "typology", "tipologia"],
  area: ["area", "parish", "freguesia", "locality", "zone", "neighbourhood", "neighborhood", "bairro", "zona"],
  district: ["district", "city", "concelho", "municipio", "distrito", "cidade"],
  price_eur: ["priceeur", "price", "preco", "asking", "askingprice", "valor"],
  size_sqm: ["sizesqm", "size", "sqm", "m2", "areasqm", "areautil", "aream2", "areabruta"],
  evidence_url: ["evidenceurl", "url", "link", "listingurl"],
  advertiser_evidence: ["advertiserevidence", "evidence", "advertiser", "advertisertype"],
  owner_status: ["ownerstatus", "verification", "verificationstatus", "status"],
  phone_visibility: ["phonevisibility", "phone", "phonevisible", "contact"],
  source_checked_on: ["checkedon", "capturedon", "captured", "date", "collectedon"],
};
const FIELD_BY_HEADER = Object.fromEntries(Object.entries(HEADERS).flatMap(([field, names]) => names.map((n) => [n, field])));

// --------------------------------------------------------------- parsing

function parseNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v).trim().replace(/[€$\s]/g, "").replace(/m2|m²|sqm/gi, "");
  // "1.150,50" -> 1150.50 ; "1,150.50" -> 1150.50 ; "585000" -> 585000
  const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseOffer(v) {
  const s = norm(v);
  if (!s) return null;
  if (/^(sale|sell|venda|vende|forsale|comprar|buy)/.test(s)) return "sale";
  if (/^(rent|arrend|aluguer|alugar|lease|torent)/.test(s)) return "rent";
  return null;
}

function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/) || s.match(/^(\d{2})[/.](\d{2})[/.](\d{4})$/);
  if (!m) return null;
  return m[1].length === 4 ? `${m[1]}-${m[2]}-${m[3]}` : `${m[3]}-${m[2]}-${m[1]}`;
}

const str = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
};

// ---------------------------------------------------------------- read file

const wb = XLSX.readFile(file, { cellDates: true });
const sheetName =
  opt("sheet") ??
  wb.SheetNames.find((n) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, range: 0, blankrows: false });
    return (rows[0] ?? []).some((h) => FIELD_BY_HEADER[norm(h)] === "listing_id");
  }) ??
  wb.SheetNames[0];
const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null, raw: true });
if (!raw.length) {
  console.error(`Sheet "${sheetName}" has no rows.`);
  process.exit(1);
}

// "Checked on" from a Summary sheet, if present.
let checkedOn = opt("checked-on");
if (!checkedOn && wb.Sheets.Summary) {
  for (const r of XLSX.utils.sheet_to_json(wb.Sheets.Summary, { header: 1 })) {
    if (norm(r[0]) === "checkedon") checkedOn = parseDate(r[1]);
  }
}

const headers = Object.keys(raw[0]);
const mapping = Object.fromEntries(headers.map((h) => [h, FIELD_BY_HEADER[norm(h)] ?? null]));
console.log(`Sheet: ${sheetName} (${raw.length} rows)`);
console.log("Column mapping:");
for (const [h, f] of Object.entries(mapping)) console.log(`  ${h.padEnd(24)} -> ${f ?? "(kept in extra)"}`);

const defaultDistrict = opt("district", "Lisboa");
const defaultPlatform = opt("platform", null);
const rows = [];
const problems = [];
raw.forEach((r, i) => {
  const lead = { extra: {} };
  for (const [h, v] of Object.entries(r)) {
    const f = mapping[h];
    if (!f) {
      if (v !== null && v !== "") lead.extra[h] = v;
      continue;
    }
    switch (f) {
      case "price_eur":
      case "size_sqm":
        lead[f] = parseNumber(v);
        break;
      case "offer":
        lead.offer = parseOffer(v);
        break;
      case "source_checked_on":
        lead.source_checked_on = parseDate(v);
        break;
      case "listing_id":
        lead.listing_id = str(v);
        break;
      default:
        lead[f] = str(v);
    }
  }
  lead.platform = lead.platform ?? defaultPlatform;
  lead.district = lead.district ?? defaultDistrict;
  lead.source_checked_on = lead.source_checked_on ?? checkedOn ?? null;
  if (lead.typology) lead.typology = lead.typology.toUpperCase().replace(/\s+/g, "");

  const line = i + 2;
  if (!lead.platform) problems.push(`row ${line}: no platform (pass --platform)`);
  if (!lead.listing_id) problems.push(`row ${line}: no listing id`);
  if (!lead.offer) problems.push(`row ${line}: offer not recognised (${r[headers.find((h) => mapping[h] === "offer")] ?? "empty"})`);
  if (!lead.area) problems.push(`row ${line}: no area`);
  if (lead.platform && lead.listing_id && lead.offer && lead.area) rows.push(lead);
});

if (problems.length) {
  console.log(`\nSkipped ${problems.length} row(s):`);
  problems.slice(0, 20).forEach((p) => console.log("  " + p));
  if (problems.length > 20) console.log(`  …and ${problems.length - 20} more`);
}

// De-duplicate inside the file (last one wins) so the upsert never sees two of the same key.
const byKey = new Map(rows.map((r) => [`${r.platform}|${r.listing_id}`, r]));
const unique = [...byKey.values()];
console.log(`\n${unique.length} lead(s) ready${rows.length !== unique.length ? ` (${rows.length - unique.length} duplicate id(s) collapsed)` : ""}; checked on: ${checkedOn ?? "unknown"}`);

if (DRY) {
  console.log("\nDry run — first row:");
  console.log(JSON.stringify(unique[0], null, 2));
  process.exit(0);
}

// ----------------------------------------------------------------- upsert

const headersHttp = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" };
let done = 0;
for (let i = 0; i < unique.length; i += 200) {
  const batch = unique.slice(i, i + 200);
  const res = await fetch(`${URL}/rest/v1/owner_leads?on_conflict=platform,listing_id`, { method: "POST", headers: headersHttp, body: JSON.stringify(batch) });
  if (!res.ok) {
    const text = await res.text();
    if (/owner_leads/.test(text) && /schema cache|does not exist/i.test(text)) {
      console.error("\nThe owner_leads table does not exist yet. Run supabase/migrations/0004_owner_leads.sql in the Supabase SQL editor, then re-run this import.");
    } else {
      console.error(`\nUpsert failed (${res.status}): ${text.slice(0, 400)}`);
    }
    process.exit(1);
  }
  done += batch.length;
  console.log(`  upserted ${done}/${unique.length}`);
}

const count = await fetch(`${URL}/rest/v1/owner_leads?select=id`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact", Range: "0-0" } });
console.log(`\nDone. owner_leads now holds ${count.headers.get("content-range")?.split("/")[1] ?? "?"} lead(s).`);
