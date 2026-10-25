// Parse one public record of Portugal's holiday-rental register (RNAL,
// rnt.turismodeportugal.pt/RNT/RNAL.aspx?nr=…). Shared by the server action
// behind "Get operator details" and scripts/scrape-rnal.mjs, so keep this file
// free of app imports (Node runs it directly via type stripping).

export const RNAL_RECORD_URL = "https://rnt.turismodeportugal.pt/RNT/RNAL.aspx?nr=";

export type RnalOperator = {
  role: string;
  role_en: string;
  kind: "person" | "company" | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  /** Company registration number; kept only for companies, never for people. */
  nipc: string | null;
};

export type RnalRecord = {
  rnal_nr: string;
  name: string;
  modality: string | null;
  guests: number | null;
  rooms: number | null;
  beds: number | null;
  parish: string | null;
  municipality: string | null;
  district: string | null;
  postcode: string | null;
  address: string | null;
  registered_on: string | null;
  opened_on: string | null;
  operators: RnalOperator[];
  source_url: string;
  checked_on: string;
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m);
}
// The register mixes encodings: a UTF-8 non-breaking space read as Latin-1 shows up as "Â ", so fold it to a space.
const text = (html: string) =>
  decode(html.replace(/<[^>]+>/g, " "))
    .replace(/Â(?=[ \s]|$)/g, "")
    .replace(/[ \s]+/g, " ")
    .trim();
const cells = (rowHtml: string) => [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
const bodyRows = (tableHtml: string) => {
  const body = tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);
};
const after = (flat: string, label: string) => {
  const i = flat.indexOf(label);
  if (i < 0) return null;
  return (
    flat
      .slice(i + label.length)
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)[0] ?? null
  );
};
const isoDate = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !s.startsWith("1900") ? s : null);
const int = (s: string | undefined) => (s && /^\d+$/.test(s.trim()) ? Number(s.trim()) : null);

/** Portuguese NIF/NIPC: 1–3 are people; 5, 6, 9 and others are companies and other entities. */
const kindOf = (nif: string) => (nif && /^[1-3]/.test(nif) ? "person" : nif ? "company" : null);
const ROLE_EN: Record<string, string> = {
  Proprietário: "Owner",
  Arrendatário: "Tenant",
  Comodatário: "Borrower",
  Usufrutuário: "Usufructuary",
  Cessionário: "Assignee",
  Outro: "Other",
};

/** Decode a register page fetched as bytes (it is served as Latin-1). */
export function decodeRnalPage(buf: ArrayBuffer) {
  return new TextDecoder("latin1").decode(buf);
}

export function parseRnal(nr: string | number, html: string): RnalRecord | null {
  if (/Registo n(?:ã|&#227;)o encontrado/.test(html)) return null;
  const flat = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, "|"))
    .replace(/Â(?=[ \s])/g, "")
    .replace(/[ \s]+/g, " ")
    .replace(/(\| ?)+/g, "|");

  const name = after(flat, "Nome do Alojamento");
  if (!name) return null;

  const capBlock =
    flat
      .split("Nº Beliches")[1]
      ?.split("|")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5) ?? [];

  const locHtml = html.split(/Localiza(?:ção|&#231;&#227;o)/)[1]?.split(/<\/table>/)[0] ?? "";
  const loc = bodyRows(locHtml)[0];
  let address: string | null = null;
  let postcode: string | null = null;
  if (loc) {
    const c = cells(loc);
    const streetType = text(c[0]?.match(/HiddenInSmartphone">([\s\S]*?)<\/div/)?.[1] ?? "");
    const parts = [streetType, text(c[1] ?? ""), text(c[2] ?? ""), text(c[3] ?? ""), text(c[4] ?? "")].filter(Boolean);
    postcode = text(c[5] ?? "") || null;
    address = [parts.join(" "), [postcode, text(c[6] ?? "")].filter(Boolean).join(" ")].filter(Boolean).join(", ") || null;
  }

  const opHtml = html.match(/id="[^"]*wtTableRecords_Titular"[\s\S]*?<\/table>/)?.[0] ?? "";
  const operators: RnalOperator[] = bodyRows(opHtml).map((row) => {
    const [roleHtml = "", nifHtml = "", nameHtml = "", contactHtml = ""] = cells(row);
    const role = text(roleHtml);
    const nif = text(nifHtml);
    const contactText = text(contactHtml);
    const email = contactText.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] ?? null;
    const phone =
      contactText
        .replace(email ?? "", "")
        .match(/(?:\+?351\s?)?\d[\d\s]{7,}\d/)?.[0]
        ?.replace(/\s+/g, "") ?? null;
    const kind = kindOf(nif);
    return { role, role_en: ROLE_EN[role] ?? role, kind, name: text(nameHtml) || null, email, phone, nipc: kind === "company" ? nif : null };
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
    source_url: RNAL_RECORD_URL + nr,
    checked_on: new Date().toISOString().slice(0, 10),
  };
}

/** Upper-case, accent-free, punctuation-free key used to match company names across sources. */
export const companyKey = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
