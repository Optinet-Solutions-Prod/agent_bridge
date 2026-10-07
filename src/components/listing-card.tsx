import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bath, BedDouble, Camera, ImageOff, Ruler } from "lucide-react";
import { AnonBadge, Badge } from "@/components/ui";
import { LISTING_STATUS_LABEL } from "@/lib/constants";
import { formatNumber, formatPrice } from "@/lib/format";
import type { ListingWithAgent } from "@/lib/types";

export function ListingCard({ listing, isOwn }: { listing: ListingWithAgent; isOwn?: boolean }) {
  const photo = listing.photo_urls[0];
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(16,24,40,0.25)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-300">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <div className="absolute left-3 top-3 flex gap-1.5">
          {isOwn && <Badge tone="blue">Yours</Badge>}
          {listing.status !== "active" && <Badge tone="amber">{LISTING_STATUS_LABEL[listing.status]}</Badge>}
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-teal-800 shadow-sm backdrop-blur">
          {listing.buyer_agent_commission_pct}% to buyer agent
        </span>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
          <div className="min-w-0">
            <p className="text-2xl font-semibold tracking-tight">{formatPrice(listing.price, listing.currency)}</p>
            <p className="truncate text-sm text-white/85">
              {listing.property_type} · {listing.locality}
            </p>
          </div>
          {listing.photo_urls.length > 1 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
              <Camera className="h-3 w-3" /> {listing.photo_urls.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-1 font-medium text-slate-900 group-hover:text-teal-800">{listing.title}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {listing.bedrooms != null && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-slate-400" /> {listing.bedrooms} bed
            </span>
          )}
          {listing.bathrooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-slate-400" /> {listing.bathrooms} bath
            </span>
          )}
          {listing.size_sqm != null && (
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5 text-slate-400" /> {formatNumber(listing.size_sqm, " m²")}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          {listing.agents ? <AnonBadge code={listing.agents.anon_code} verified={listing.agents.verified} prefix="Listing Agent" /> : <span />}
          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400 transition group-hover:text-teal-700">
            View <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
