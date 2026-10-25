// Load the government open datasets and the company facts into Supabase.
//
//   node scripts/import-open-data.mjs [--only rnal|rnet|companies] [--dry-run]
//
// Inputs (download links in README):
//   data/open/rnal-all.csv     holiday-rental register (Turismo de Portugal open data)
//   data/open/rnet-all.csv     tourist-property register (Turismo de Portugal open data)
//   data/open/companies.json   from scripts/enrich-companies.mjs
// Needs migration 0007_sources.sql and SUPABASE_SERVICE_KEY in .env.
// Upserts only the open-data columns, so operator details fetched earlier stay.

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const argv = process.argv.slice(2);
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const dryRun = argv.includes("--dry-run");
const today = new Date().toISOString().slice(0, 10);

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

function csvRows(path) {
  const text = readFileSync(path, "utf8").replace(/^﻿/, "");
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const nz = (s) => (s && s.trim() ? s.trim().replace(/\s+/g, " ") : null);
const int = (s) => (s && /^-?\d+$/.test(s.trim()) ? Number(s.trim()) : null);
const date = (s) => {
  const m = s?.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  return m && m[1] !== "1900" ? `${m[1]}-${m[2]}-${m[3]}` : null;
};
const latLng = (s) => {
  const [a, b] = (s ?? "").split(";").map((x) => Number(x.trim().replace(",", ".")));
  return Number.isFinite(a) && Number.isFinite(b) && a !== 0 ? { lat: a, lng: b } : { lat: null, lng: null };
};
const yes = (s) => /^sim$/i.test(s ?? "");
const dedupe = (rows, key) => [...new Map(rows.map((r) => [r[key], r])).values()];

const db = dryRun ? null : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

async function upsert(table, rows, onConflict, size = 1000) {
  console.log(`${table}: ${rows.length} rows${dryRun ? " (dry run)" : ""}`);
  if (dryRun) return console.log("  sample:", JSON.stringify(rows[0]).slice(0, 400));
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + size), { onConflict });
    if (error) throw new Error(`${table} @${i}: ${error.message}${error.code === "PGRST204" || error.code === "PGRST205" ? " (run supabase/migrations/0007_sources.sql first)" : ""}`);
    if ((i / size) % 10 === 0) process.stdout.write(`  ${Math.min(i + size, rows.length)}/${rows.length}\r`);
  }
  const { count } = await db.from(table).select("*", { count: "exact", head: true });
  console.log(`  done; ${table} now holds ${count} rows.          `);
}

if (!only || only === "rnal") {
  const rows = csvRows("data/open/rnal-all.csv").map((r) => ({
    rnal_nr: r.NrRNAL,
    name: nz(r.Denominacao),
    modality: nz(r.Modalidade),
    guests: int(r.NrUtentes),
    address: nz(r.Endereco),
    postcode: nz(r.CodigoPostal),
    locality: nz(r.LOCALIDADE),
    parish: nz(r.Freguesia),
    municipality: nz(r.Concelho),
    district: nz(r.Distrito),
    region: nz(r.NUTSII),
    ...latLng(r.LatLong),
    registered_on: date(r.DataRegisto),
    opened_on: date(r.DataAberturaPublico),
    source: "RNAL open data",
    source_url: `https://rnt.turismodeportugal.pt/RNT/RNAL.aspx?nr=${r.NrRNAL}`,
    checked_on: today,
  }));
  await upsert("register_rentals", dedupe(rows.filter((r) => /^\d+$/.test(r.rnal_nr)), "rnal_nr"), "rnal_nr");
}

if (!only || only === "rnet") {
  const rows = csvRows("data/open/rnet-all.csv").map((r) => ({
    rnet_nr: r.NrRNET,
    name: nz(r.Denominacao),
    type: nz(r.TipologiaET),
    category: int(r.Categoria),
    units: int(r.NrUnidAloj),
    beds: int(r.NrCamasFixas),
    rooms: int(r.NrQuartos),
    owner_entity: nz(r.EntProprietaria),
    operator_entity: nz(r.EntExploradora),
    email: nz(r.Email),
    website: nz(r.Website),
    address: nz(r.Endereco),
    postcode: nz(r.CodigoPostal),
    locality: nz(r.LocalidadeCP),
    parish: nz(r.Freguesia),
    municipality: nz(r.Concelho),
    district: nz(r.Distrito),
    region: nz(r.NUTSII),
    ...latLng(r.LatLong),
    golf: yes(r.CampoGolfe),
    spa: yes(r.SPA),
    listed_building: yes(r.ImovelClassificado),
    opened_on: date(r.DataTituloValAbert),
    source: "RNET open data",
    source_url: `https://rnt.turismodeportugal.pt/RNT/RNET.aspx?nr=${r.NrRNET}`,
    checked_on: today,
  }));
  await upsert("tourism_properties", dedupe(rows.filter((r) => /^\d+$/.test(r.rnet_nr)), "rnet_nr"), "rnet_nr");
}

if ((!only || only === "companies") && existsSync("data/open/companies.json")) {
  const rows = JSON.parse(readFileSync("data/open/companies.json", "utf8")).map((c) => ({
    name_key: c.name_key,
    name: c.name,
    found: !!c.found,
    nif: c.nif ?? null,
    address: c.address ?? null,
    legal_form: c.legal_form ?? null,
    capital: c.capital ?? null,
    activity: c.activity ?? null,
    founded_on: c.founded_on ?? null,
    source: "Racius company directory",
    source_url: c.source_url ?? null,
    checked_on: c.checked_on ?? today,
  }));
  await upsert("companies", dedupe(rows, "name_key"), "name_key", 500);
}
