import Link from "next/link";
import { AnonBadge, Badge } from "@/components/ui";
import { formatPrice, timeAgo } from "@/lib/format";
import type { BuyerRequestWithAgent } from "@/lib/types";

export function budgetLabel(min: number | null, max: number | null) {
  if (min != null && max != null) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (max != null) return `up to ${formatPrice(max)}`;
  if (min != null) return `from ${formatPrice(min)}`;
  return "Budget open";
}

export function RequestCard({ request, isOwn }: { request: BuyerRequestWithAgent; isOwn?: boolean }) {
  return (
    <Link
      href={`/requests/${request.id}`}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-slate-900">{request.title}</p>
        <div className="flex shrink-0 gap-1.5">
          {isOwn && <Badge tone="blue">Yours</Badge>}
          {request.status !== "active" && <Badge tone="amber">{request.status}</Badge>}
        </div>
      </div>
      <p className="mt-1 text-lg font-semibold text-teal-800">{budgetLabel(request.min_price, request.max_price)}</p>
      <p className="mt-2 text-sm text-slate-600">
        {request.property_types.length ? request.property_types.join(", ") : "Any property type"}
        {request.min_bedrooms != null ? ` · ${request.min_bedrooms}+ bed` : ""}
        {request.min_size_sqm != null ? ` · ${request.min_size_sqm}+ m²` : ""}
      </p>
      <p className="mt-1 line-clamp-1 text-sm text-slate-500">
        {request.localities.length ? request.localities.join(", ") : "Anywhere in Malta & Gozo"}
      </p>
      <div className="mt-4 flex items-center justify-between">
        {request.agents ? <AnonBadge code={request.agents.anon_code} verified={request.agents.verified} prefix="Buyer Agent" /> : <span />}
        <span className="text-xs text-slate-500">{timeAgo(request.created_at)}</span>
      </div>
    </Link>
  );
}
