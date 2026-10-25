// Look up the companies that own or run tourist properties (and company
// operators of holiday rentals) in the public company directory (racius.com):
// tax number, head office, legal form, share capital, activity, founded date.
//
//   node scripts/enrich-companies.mjs [--delay 1100] [--limit 0]
//
// Company facts only; no people. Resumable: names already in the output are
// skipped. Output: data/open/companies.json (then import-open-data.mjs loads it).

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1]]] : a), []));
const DELAY = Number(args.delay ?? 1100);
const LIMIT = Number(args.limit ?? 0);
const OUT = "data/open/companies.json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const COMPANY = /\b(LDA|LIMITADA|S\.?\s?A\.?|UNIP|UNIPESSOAL|SOCIEDADE|SGPS|CRL|COOPERATIVA)\b/i;
export const nameKey = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

function slug(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/\bs\.\s?a\.?/g, "sa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function variants(name) {
  const base = slug(name);
  // One request per name, a second only when the register abbreviated the legal form.
  const out = new Set([base]);
  if (/-(unip|unipessoal|limitada)$/.test(base)) out.add(base.replace(/-unip$|-unipessoal$/, "-unipessoal-lda").replace(/-limitada$/, "-lda"));
  return [...out].filter(Boolean);
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
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", euro: "€", ordm: "º", ordf: "ª" };
const MARK = { acute: "́", grave: "̀", circ: "̂", tilde: "̃", cedil: "̧", uml: "̈" };
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&([a-zA-Z])(acute|grave|circ|tilde|cedil|uml);/g, (_, l, m) => (l + MARK[m]).normalize("NFC"))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);

function parse(html, url, name) {
  const flat = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, "|"))
    .replace(/\s+/g, " ")
    .replace(/(\| ?)+/g, "|");
  const after = (label, n = 1) => {
    const i = flat.indexOf(`|${label}|`);
    if (i < 0) return null;
    return flat.slice(i + label.length + 2).split("|").map((s) => s.trim()).filter((s) => s && !s.startsWith("ico-")).slice(0, n);
  };
  const nif = after("NIF")?.[0];
  if (!nif || !/^\d{9}$/.test(nif)) return null;
  const morada = after("Morada", 3) ?? [];
  const founded = flat.match(/constitu[ií]da em (\d{2})\/(\d{2})\/(\d{4})/);
  return {
    name_key: nameKey(name),
    name,
    found: true,
    nif,
    address: morada.join(", ") || null,
    legal_form: after("Forma Jurídica")?.[0] ?? null,
    capital: after("Capital Social")?.[0] ?? null,
    activity: (after("Atividade")?.[0] ?? "").slice(0, 600) || null,
    founded_on: founded ? `${founded[3]}-${founded[2]}-${founded[1]}` : null,
    source_url: url,
    checked_on: new Date().toISOString().slice(0, 10),
  };
}

// Names to look up.
const names = new Map();
for (const r of csvRows("data/open/rnet-all.csv")) for (const k of ["EntProprietaria", "EntExploradora"]) {
  const v = (r[k] ?? "").trim();
  if (v && COMPANY.test(v)) names.set(nameKey(v), v);
}
if (existsSync("data/private/rnal-owners.json"))
  for (const r of JSON.parse(readFileSync("data/private/rnal-owners.json", "utf8")))
    for (const o of r.operators) if (o.kind === "company" && o.name) names.set(nameKey(o.name), o.name);

const results = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const done = new Set(results.map((r) => r.name_key));
const todo = [...names.entries()].filter(([k]) => !done.has(k));
console.log(`${names.size} companies, ${done.size} done, ${todo.length} to look up`);

let n = 0, hits = 0;
for (const [key, name] of LIMIT ? todo.slice(0, LIMIT) : todo) {
  let rec = null;
  for (const v of variants(name)) {
    const url = `https://www.racius.com/${v}/`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Ponte demo)", "Accept-Language": "pt-PT" }, redirect: "follow" });
      if (res.status === 429) { await sleep(DELAY * 20); continue; }
      if (res.ok && res.url.replace(/\/$/, "").endsWith(v)) rec = parse(await res.text(), url, name);
    } catch {}
    await sleep(DELAY);
    if (rec) break;
  }
  results.push(rec ?? { name_key: key, name, found: false, source_url: null, checked_on: new Date().toISOString().slice(0, 10) });
  n++;
  if (rec) hits++;
  if (n % 25 === 0) {
    writeFileSync(OUT, JSON.stringify(results, null, 1));
    console.log(`${n}/${todo.length}  found ${hits} (${Math.round((hits / n) * 100)}%)`);
  }
}
writeFileSync(OUT, JSON.stringify(results, null, 1));
console.log(`done: ${n} looked up, ${hits} found -> ${OUT}`);
