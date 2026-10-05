import { CO_BROKER_TERMS } from "@/lib/constants";
import { dealEconomics, formatPrice } from "@/lib/format";

export function DealTerms() {
  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
      {CO_BROKER_TERMS.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ol>
  );
}

export function DealEconomics({
  price,
  commissionPct,
  platformFeePct,
  label = "Based on the asking price",
}: {
  price: number;
  commissionPct: number;
  platformFeePct: number;
  label?: string;
}) {
  const e = dealEconomics(price, commissionPct, platformFeePct);
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-slate-500">{label}</dt>
        <dd className="font-medium">{formatPrice(price)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">Buyer-agent commission ({commissionPct}%)</dt>
        <dd className="font-medium">{formatPrice(e.buyerSideCommission)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">AgentBridge fee per side ({platformFeePct}%)</dt>
        <dd className="font-medium text-teal-800">{formatPrice(e.platformFeePerSide)}</dd>
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-2">
        <dt className="text-slate-500">Buyer agent receives (net)</dt>
        <dd className="font-semibold">{formatPrice(e.buyerAgentNet)}</dd>
      </div>
    </dl>
  );
}
