export function formatPrice(value: number | string | null | undefined, currency = "EUR") {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(value: number | string | null | undefined, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return `${new Intl.NumberFormat("en-MT", { maximumFractionDigits: 0 }).format(n)}${suffix}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

/** Commission economics shown in Deal Rooms. */
export function dealEconomics(price: number, buyerCommissionPct: number, platformFeePct: number) {
  const buyerSideCommission = (price * buyerCommissionPct) / 100;
  const platformFee = (buyerSideCommission * platformFeePct) / 100;
  return {
    buyerSideCommission,
    platformFeePerSide: platformFee,
    buyerAgentNet: buyerSideCommission - platformFee,
  };
}
