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
import { decodeRnalPage, parseRnal, RNAL_RECORD_URL } from "../src/lib/rnal.ts";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const FROM = Number(args.from ?? 182100);
const COUNT = Number(args.count ?? 150);
const DELAY = Number(args.delay ?? 1100);
const OUT = args.out ?? "data/private/rnal-owners.json";
const MAX_MISSES = 400; // give up after this many missing numbers in a row
const BASE = RNAL_RECORD_URL;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRecord(nr) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(BASE + nr, { headers: { "User-Agent": "Mozilla/5.0 (Ponte demo; contact via site)", "Accept-Language": "pt-PT,pt;q=0.9" } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return decodeRnalPage(await res.arrayBuffer());
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
  const rec = parseRnal(nr, html);
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
