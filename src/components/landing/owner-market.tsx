import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { OwnerLeadOverview } from "@/lib/types";

/**
 * Aggregates only: how many private owners are selling or letting on their
 * own, by area. Individual listings never leave the app (owner_lead_overview
 * is the only thing anon may call). Renders nothing until data is imported.
 */
export async function OwnerMarket() {
  let overview: OwnerLeadOverview | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("owner_lead_overview");
    overview = (data ?? null) as OwnerLeadOverview | null;
  } catch {
    overview = null;
  }
  if (!overview || !overview.total) return null;

  const rows = overview.by_area.slice(0, 10);
  const districts = [...new Set(overview.by_area.map((a) => a.district))];
  const where = districts.length === 1 ? districts[0] : `${districts.length} districts`;

  return (
    <section aria-labelledby="owner-market-heading" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div>
          <h2 id="owner-market-heading" className="max-w-[18ch] font-display text-[2rem] leading-[1.08] tracking-tight sm:text-[2.6rem]">
            Owners selling on their own are part of the picture.
          </h2>
          <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink/80">
            We follow public listings placed directly by private owners across {where}: {overview.total} right now in {overview.areas} areas
            {overview.checked_on ? `, last checked ${formatDate(overview.checked_on)}` : ""}. Agents on AgentBridge see each one as a lead, with the
            evidence behind it; identities are never assumed, and nothing is scraped by the app itself.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-2">
            <div>
              <dt className="text-[13px] text-ink/70">Owner listings tracked</dt>
              <dd className="mt-1 font-display text-[2rem] leading-none tracking-tight">{overview.total}</dd>
            </div>
            {overview.median_sale_eur_sqm != null && (
              <div>
                <dt className="text-[13px] text-ink/70">Median asking, for sale</dt>
                <dd className="mt-1 font-display text-[2rem] leading-none tracking-tight">{formatPrice(Math.round(overview.median_sale_eur_sqm))}<span className="text-base text-ink/60"> /m²</span></dd>
              </div>
            )}
            {overview.median_rent_eur != null && (
              <div>
                <dt className="text-[13px] text-ink/70">Median rent asked</dt>
                <dd className="mt-1 font-display text-[2rem] leading-none tracking-tight">{formatPrice(Math.round(overview.median_rent_eur))}<span className="text-base text-ink/60"> /month</span></dd>
              </div>
            )}
          </dl>
          <Link href="/leads" className="mt-8 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[15px] font-medium text-limestone transition hover:bg-brand-900 active:scale-[0.98]">
            See the leads as an agent
          </Link>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-ink/10 bg-white/70">
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-ink/10 text-[13px] text-ink/70">
                <th scope="col" className="px-4 py-3 font-medium sm:px-5">Area</th>
                <th scope="col" className="px-3 py-3 text-right font-medium tabular-nums">Listings</th>
                <th scope="col" className="hidden px-3 py-3 text-right font-medium sm:table-cell">Median asking</th>
                <th scope="col" className="px-4 py-3 text-right font-medium sm:px-5">Per m²</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {rows.map((a) => (
                <tr key={`${a.district}-${a.area}`}>
                  <td className="px-4 py-3 sm:px-5">
                    <span className="font-medium">{a.area}</span>
                    {districts.length > 1 && <span className="text-ink/60">, {a.district}</span>}
                    <span className="block text-[13px] text-ink/60 sm:hidden">
                      {a.sale ? `${a.sale} for sale` : ""}
                      {a.sale && a.rent ? ", " : ""}
                      {a.rent ? `${a.rent} to rent` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{a.listings}</td>
                  <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell">
                    {a.median_sale_eur != null ? formatPrice(Math.round(a.median_sale_eur)) : a.median_rent_eur != null ? `${formatPrice(Math.round(a.median_rent_eur))} /mo` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums sm:px-5">{a.median_sale_eur_sqm != null ? formatPrice(Math.round(a.median_sale_eur_sqm)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {overview.by_area.length > rows.length && (
            <p className="border-t border-ink/10 px-4 py-3 text-[13px] text-ink/70 sm:px-5">And {overview.by_area.length - rows.length} more areas inside the app.</p>
          )}
        </div>
      </div>
    </section>
  );
}
