import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, ImageOff, Ruler } from "lucide-react";
import { AnonBadge, Badge } from "@/components/ui";
import { LISTING_STATUS_LABEL } from "@/lib/constants";
import { formatNumber, formatPrice } from "@/lib/format";
import type { ListingWithAgent } from "@/lib/types";

export function ListingCard({ listing, isOwn }: { listing: ListingWithAgent; isOwn?: boolean }) {
  const photo = listing.photo_urls[0];
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {photo ? (
          <Image src={photo} alt="" fill sizes="(min-width: 1024px) 320px, 100vw" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-slate-300">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {isOwn && <Badge tone="blue">Yours</Badge>}
          {listing.status !== "active" && <Badge tone="amber">{LISTING_STATUS_LABEL[listing.status]}</Badge>}
        </div>
        <div className="absolute bottom-3 right-3">
          <Badge tone="teal" className="bg-white/90">
            {listing.buyer_agent_commission_pct}% to buyer agent
          </Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-lg font-semibold text-slate-900">{formatPrice(listing.price, listing.currency)}</p>
        <p className="mt-0.5 line-clamp-1 text-sm font-medium text-slate-800 group-hover:text-teal-800">{listing.title}</p>
        <p className="mt-0.5 text-sm text-slate-500">
          {listing.property_type} · {listing.locality}
          {listing.region ? `, ${listing.region}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {listing.bedrooms != null && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {listing.bedrooms} bed
            </span>
          )}
          {listing.bathrooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {listing.bathrooms} bath
            </span>
          )}
          {listing.size_sqm != null && (
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" /> {formatNumber(listing.size_sqm, " m²")}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          {listing.agents ? <AnonBadge code={listing.agents.anon_code} verified={listing.agents.verified} prefix="Listing Agent" /> : <span />}
        </div>
      </div>
    </Link>
  );
}
