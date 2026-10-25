import { formatPrice } from "@/lib/format";
import type { MatchCriteria } from "@/lib/types";

/** One line that says what the deck is filtered by, e.g. "3+ beds, 8 localities, €400k–€900k". */
export function briefSummary(c: MatchCriteria) {
  const parts: string[] = [];
  parts.push(c.min_bedrooms ? `${c.min_bedrooms}+ beds` : "Any beds");
  parts.push(c.localities.length === 0 ? "anywhere in Portugal" : c.localities.length <= 2 ? c.localities.join(", ") : `${c.localities.length} localities`);
  if (c.min_price && c.max_price) parts.push(`${formatPrice(c.min_price)}–${formatPrice(c.max_price)}`);
  else if (c.max_price) parts.push(`up to ${formatPrice(c.max_price)}`);
  else if (c.min_price) parts.push(`from ${formatPrice(c.min_price)}`);
  else parts.push("any budget");
  if (c.property_types.length) parts.push(c.property_types.length <= 2 ? c.property_types.join(" / ") : `${c.property_types.length} types`);
  return parts.join(", ");
}
