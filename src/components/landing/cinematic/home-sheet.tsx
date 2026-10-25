"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { formatNumber, formatPrice } from "@/lib/format";
import { unsplashBlur } from "@/lib/image-loader";
import { cn } from "@/lib/utils";

/** Native <dialog> detail sheet for a showcase home; enters via @starting-style. */
export function HomeSheet({ home, onClose }: { home: ShowcaseHome; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showModal();
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="sheet fixed inset-0 m-auto w-[min(100vw-1.5rem,760px)] max-w-none overflow-hidden rounded-[24px] bg-limestone p-0 text-ink shadow-2xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={home.title}
    >
      <div className="grid max-h-[88dvh] overflow-y-auto sm:grid-cols-[1.15fr_1fr]" style={{ overscrollBehavior: "contain" }}>
        <div className="relative aspect-[4/3] bg-sand sm:aspect-auto sm:min-h-[480px]">
          <Image
            src={home.photos[photo] ?? home.photos[0]}
            alt=""
            fill
            sizes="(min-width: 640px) 440px, 100vw"
            className="object-cover"
            placeholder="blur"
            blurDataURL={unsplashBlur(home.photos[photo] ?? home.photos[0])}
          />
          {home.photos.length > 1 && (
            <div className="absolute inset-x-0 bottom-1 flex justify-center">
              {home.photos.map((_, i) => (
                <button key={i} type="button" aria-label={`Photo ${i + 1} of ${home.photos.length}`} aria-current={i === photo} onClick={() => setPhoto(i)} className="grid h-10 min-w-6 place-items-center px-1">
                  <span className={cn("block h-1.5 rounded-full transition-[width,background-color] duration-200", i === photo ? "w-6 bg-limestone" : "w-1.5 bg-limestone/55")} />
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-ink/60 text-limestone backdrop-blur transition hover:bg-ink/80 active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col p-5 sm:p-7">
          <p className="font-display text-[34px] leading-none tracking-tight">{formatPrice(home.price)}</p>
          <h3 className="mt-3 text-lg font-medium leading-snug">{home.title}</h3>
          <p className="text-[15px] text-ink/75">
            {home.type} in {home.locality}, {home.district}
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-ink/10 py-4 text-[15px]">
            <div>
              <dt className="text-ink/70">Bedrooms</dt>
              <dd className="mt-0.5 font-medium">{home.beds ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink/70">Bathrooms</dt>
              <dd className="mt-0.5 font-medium">{home.baths ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink/70">Interior</dt>
              <dd className="mt-0.5 font-medium">{home.sqm != null ? formatNumber(home.sqm, " m²") : "—"}</dd>
            </div>
          </dl>
          <p className="mt-5 text-[15px] leading-relaxed text-ink/85">{home.blurb}</p>
          <p className="mt-4 text-[13px] text-ink/70">Listed by a verified agency on AgentBridge. The exact address is shared once terms are agreed.</p>
          <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
            <Link href="/dashboard" className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-brand-700 px-5 text-[15px] font-medium text-white transition hover:bg-brand-800 active:scale-[0.98]">
              Ask about this home
            </Link>
            <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-[15px] font-medium text-ink transition hover:border-ink/35 active:scale-[0.98]">
              Keep browsing
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
