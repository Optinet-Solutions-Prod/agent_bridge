// Collect a demo sample of holiday rentals and their operators from the
// official RNAL register (Registo Nacional de Alojamento Local, Turismo de
// Portugal). Each public record lists who runs the rental (owner, tenant or
// borrower) with name and contacts, published under DL 128/2014, art. 10.
//
//   node scripts/scrape-rnal.mjs [--from 182100] [--count 150] [--delay 1100]
//                                [--out data/private/rnal-owners.json]
//
// Walks register numbers downwards from --from, one request at a time with a
// polite delay, skips numbers that don't exist, and stops after --count
// records. Re-running resumes: numbers already in the output are skipped.
// The output holds personal data and is git-ignored (data/private/).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const FROM = Number(args.from ?? 182100);
const COUNT = Number(args.count ?? 150);
const DELAY = Number(args.delay ?? 1100);
const OUT = args.out ?? "data/private/rnal-owners.json";
const MAX_MISSES = 400; // give up after this many missing numbers in a row
const BASE = "https://rnt.turismodeportugal.pt/RNT/RNAL.aspx?nr=";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
const text = (html) => decode(html.replace(/<[^>]+>/g, " ")).replace(/[ \s]+/g, " ").trim();
const cells = (rowHtml) => [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
const bodyRows = (tableHtml) => {
  const body = tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);
};
const after = (flat, label) => {
  const i = flat.indexOf(label);
  if (i < 0) return null;
  const rest = flat.slice(i + label.length).split("|").map((s) => s.trim()).filter(Boolean);
  return rest[0] ?? null;
};
const isoDate = (s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !s.startsWith("1900") ? s : null);
const int = (s) => (s && /^\d+$/.test(s.trim()) ? Number(s.trim()) : null);

/** Portuguese NIF/NIPC: 5xx/6xx/9xx are companies and other entities; 1–3 are people. */
const kindOf = (nif) => (nif && /^[1-3]/.test(nif) ? "person" : nif ? "company" : null);
const ROLE_EN = { "Proprietário": "Owner", "Arrendatário": "Tenant", "Comodatário": "Borrower", "Usufrutuário": "Usufructuary", "Cessionário": "Assignee", Outro: "Other" };

function parse(nr, html) {
  if (/Registo n(?:ã|&#227;)o encontrado/.test(html)) return null;
  const flat = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, "|"))
    .replace(/[ \s]+/g, " ")
    .replace(/(\| ?)+/g, "|");

  const name = after(flat, "Nome do Alojamento");
  if (!name) return null;

  // Capacity: the five numbers after the five column labels.
  const capBlock = flat.split("Nº Beliches")[1]?.split("|").map((s) => s.trim()).filter(Boolean).slice(0, 5) ?? [];

  // Location table (first table after "Localização").
  const locHtml = html.split(/Localiza(?:ção|&#231;&#227;o)/)[1]?.split(/<\/table>/)[0] ?? "";
  const loc = bodyRows(locHtml)[0];
  let address = null;
  let postcode = null;
  if (loc) {
    const c = cells(loc);
    const streetType = text(c[0]?.match(/HiddenInSmartphone">([\s\S]*?)<\/div/)?.[1] ?? "");
    const parts = [streetType, text(c[1] ?? ""), text(c[2] ?? ""), text(c[3] ?? ""), text(c[4] ?? "")].filter(Boolean);
    postcode = text(c[5] ?? "") || null;
    address = [parts.join(" "), [postcode, text(c[6] ?? "")].filter(Boolean).join(" ")].filter(Boolean).join(", ") || null;
  }

  // Operators table.
  const opHtml = html.match(/id="[^"]*wtTableRecords_Titular"[\s\S]*?<\/table>/)?.[0] ?? "";
  const operators = bodyRows(opHtml).map((row) => {
    const [roleHtml, nifHtml, nameHtml, contactHtml = ""] = cells(row);
    const role = text(roleHtml ?? "");
    const nif = text(nifHtml ?? "");
    const contactText = text(contactHtml);
    const email = contactText.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] ?? null;
    const phone =
      contactText
        .replace(email ?? "", "")
        .match(/(?:\+?351\s?)?\d[\d\s]{7,}\d/)?.[0]
        ?.replace(/\s+/g, "") ?? null;
    return { role, role_en: ROLE_EN[role] ?? role, kind: kindOf(nif), name: text(nameHtml ?? "") || null, email, phone };
  });

  return {
    rnal_nr: String(nr),
    name,
    modality: after(flat, "Modalidade"),
    guests: int(capBlock[0]),
    rooms: int(capBlock[1]),
    beds: int(capBlock[2]),
    parish: after(flat, "Freguesia:"),
    municipality: after(flat, "Concelho:"),
    district: after(flat, "Distrito:"),
    postcode,
    address,
    registered_on: isoDate(flat.match(/Registado em\D{0,20}(\d{4}-\d{2}-\d{2})/)?.[1] ?? null),
    opened_on: isoDate(after(flat, "Data de abertura ao público")),
    operators,
    source_url: BASE + nr,
    checked_on: new Date().toISOString().slice(0, 10),
  };
}

async function fetchRecord(nr) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(BASE + nr, { headers: { "User-Agent": "Mozilla/5.0 (Ponte demo; contact via site)", "Accept-Language": "pt-PT,pt;q=0.9" } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      return new TextDecoder("latin1").decode(buf);
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(DELAY * 4 * attempt);
    }
  }
}

const records = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const done = new Set(records.map((r) => r.rnal_nr));
mkdirSync(dirname(OUT), { recursive: true });
const save = () => writeFileSync(OUT, JSON.stringify(records, null, 2));

let nr = FROM;
let misses = 0;
let added = 0;
while (added < COUNT && misses < MAX_MISSES && nr > 0) {
  if (done.has(String(nr))) {
    nr--;
    continue;
  }
  const html = await fetchRecord(nr);
  const rec = parse(nr, html);
  if (rec) {
    records.push(rec);
    added++;
    misses = 0;
    const op = rec.operators[0];
    console.log(
      `${String(added).padStart(3)}  ${rec.rnal_nr}/AL  ${(rec.municipality ?? "?").padEnd(18)} ${(op?.role_en ?? "?").padEnd(8)} ${op?.kind ?? "?"}  email:${op?.email ? "y" : "-"} phone:${op?.phone ? "y" : "-"}`,
    );
    if (added % 10 === 0) save();
  } else {
    misses++;
  }
  nr--;
  await sleep(DELAY);
}
save();
console.log(`\n${added} new records (${records.length} total) -> ${OUT}${misses >= MAX_MISSES ? "  (stopped: too many missing numbers in a row)" : ""}`);
