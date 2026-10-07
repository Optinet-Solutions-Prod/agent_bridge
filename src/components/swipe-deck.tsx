"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowUpRight, Bath, BedDouble, Heart, ImageOff, Info, RotateCcw, Ruler, Trees, X } from "lucide-react";
import { recordSwipe, undoSwipe } from "@/app/(app)/discover/actions";
import { AnonBadge, Chip } from "@/components/ui";
import { formatNumber, formatPrice } from "@/lib/format";
import type { ListingWithAgent, SwipeDecision } from "@/lib/types";
import { cn } from "@/lib/utils";

const THRESHOLD = 110; // px of horizontal drag that counts as a decision
const EXIT_MS = 320;
const TAP_SLOP = 6;

type Gone = { listing: ListingWithAgent; decision: SwipeDecision };

const stop = (e: ReactPointerEvent) => e.stopPropagation();

export function SwipeDeck({
  listings,
  requestId,
  likedCount: initialLiked,
  shortlistHref,
}: {
  listings: ListingWithAgent[];
  requestId: string | null;
  likedCount: number;
  shortlistHref: string;
}) {
  const [cards, setCards] = useState(listings);
  const [gone, setGone] = useState<Gone[]>([]);
  const [liked, setLiked] = useState(initialLiked);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<SwipeDecision | null>(null);
  const [photo, setPhoto] = useState(0);
  const [info, setInfo] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = useRef(false);

  const top = cards[0];

  const decide = useCallback(
    (decision: SwipeDecision) => {
      if (!top || exit) return;
      const current = top;
      setExit(decision);
      recordSwipe(current.id, requestId, decision)
        .then((r) => {
          if (r.error) setSaveError(r.error);
        })
        .catch(() => setSaveError("That swipe could not be saved. Check your connection."));
      window.setTimeout(() => {
        setCards((c) => c.filter((l) => l.id !== current.id));
        setGone((g) => [...g, { listing: current, decision }]);
        if (decision === "like") setLiked((n) => n + 1);
        setExit(null);
        setDrag({ x: 0, y: 0 });
        setPhoto(0);
        setInfo(false);
      }, EXIT_MS);
    },
    [top, exit, requestId],
  );

  const undo = useCallback(() => {
    const last = gone[gone.length - 1];
    if (!last || exit) return;
    setGone((g) => g.slice(0, -1));
    setCards((c) => [last.listing, ...c]);
    if (last.decision === "like") setLiked((n) => Math.max(0, n - 1));
    setPhoto(0);
    setInfo(false);
    undoSwipe(last.listing.id, requestId).catch(() => {});
  }, [gone, exit, requestId]);

  // Keyboard: ← pass, → like, ↑ details, ↓ close, space next photo, z / backspace undo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") decide("like");
      else if (e.key === "ArrowLeft") decide("pass");
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        setInfo((v) => !v);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setInfo(false);
      } else if (e.key === "z" || e.key === "Backspace") undo();
      else if (e.key === " " && top && top.photo_urls.length > 1) {
        e.preventDefault();
        setPhoto((p) => (p + 1) % top.photo_urls.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, undo, top]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (exit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    moved.current = false;
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!start.current || start.current.id !== e.pointerId) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) moved.current = true;
    setDrag({ x: dx, y: dy });
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!start.current || start.current.id !== e.pointerId) return;
    const dx = e.clientX - start.current.x;
    const rect = e.currentTarget.getBoundingClientRect();
    start.current = null;
    setDragging(false);

    if (!moved.current) {
      // A tap flips photos: left third goes back, the rest goes forward.
      if (top && top.photo_urls.length > 1 && !info) {
        const rel = (e.clientX - rect.left) / rect.width;
        const n = top.photo_urls.length;
        setPhoto((p) => (rel < 0.35 ? (p - 1 + n) % n : (p + 1) % n));
      }
      setDrag({ x: 0, y: 0 });
      return;
    }
    if (dx > THRESHOLD) decide("like");
    else if (dx < -THRESHOLD) decide("pass");
    else setDrag({ x: 0, y: 0 });
  }

  const likeOpacity = Math.min(1, Math.max(0, drag.x / 90));
  const passOpacity = Math.min(1, Math.max(0, -drag.x / 90));
  let transform = `translate3d(${drag.x}px, ${drag.y * 0.25}px, 0) rotate(${drag.x / 18}deg)`;
  let opacity = 1;
  if (exit) {
    const dir = exit === "like" ? 1 : -1;
    const fly = typeof window === "undefined" ? 900 : window.innerWidth + 200;
    transform = `translate3d(${dir * fly}px, ${drag.y * 0.25 - 40}px, 0) rotate(${dir * 28}deg)`;
    opacity = 0;
  }

  if (!top) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <Heart className="h-6 w-6" />
        </div>
        <p className="text-base font-semibold text-slate-900">That&apos;s everything for this brief</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
          You shortlisted {liked} propert{liked === 1 ? "y" : "ies"}. Message those agents, or widen the brief above to keep going.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          {gone.length > 0 && (
            <button type="button" onClick={undo} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <RotateCcw className="h-4 w-4" /> Undo last
            </button>
          )}
          <Link href={shortlistHref} className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800">
            <Heart className="h-4 w-4" /> View shortlist
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[440px]">
      {/* Deck */}
      <div className="relative h-[min(70dvh,620px)] w-full touch-none select-none">
        {cards
          .slice(0, 3)
          .map((listing, i) => ({ listing, i }))
          .reverse()
          .map(({ listing, i }) =>
            i === 0 ? (
              <div
                key={listing.id}
                className={cn("absolute inset-0 will-change-transform", dragging ? "cursor-grabbing" : "cursor-grab")}
                style={{
                  transform,
                  opacity,
                  transition: dragging ? "none" : `transform ${EXIT_MS}ms cubic-bezier(.2,.8,.2,1), opacity ${EXIT_MS}ms ease`,
                  zIndex: 3,
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => {
                  start.current = null;
                  setDragging(false);
                  setDrag({ x: 0, y: 0 });
                }}
              >
                <CardFace
                  listing={listing}
                  photo={photo}
                  info={info}
                  onToggleInfo={() => setInfo((v) => !v)}
                  likeOpacity={exit === "like" ? 1 : likeOpacity}
                  passOpacity={exit === "pass" ? 1 : passOpacity}
                  priority
                />
              </div>
            ) : (
              <div
                key={listing.id}
                className="absolute inset-0 transition-transform duration-300"
                style={{ transform: `scale(${1 - i * 0.05}) translateY(${i * 16}px)`, opacity: 1 - i * 0.2, zIndex: 3 - i }}
                aria-hidden
              >
                <CardFace listing={listing} photo={0} info={false} likeOpacity={0} passOpacity={0} />
              </div>
            ),
          )}
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={undo}
          disabled={gone.length === 0 || !!exit}
          aria-label="Undo last swipe"
          title="Undo (Z)"
          className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => decide("pass")}
          disabled={!!exit}
          aria-label="Pass"
          title="Pass (←)"
          className="grid h-16 w-16 place-items-center rounded-full border border-rose-200 bg-white text-rose-500 shadow-lg shadow-rose-900/10 transition hover:scale-105 hover:bg-rose-50 active:scale-95 disabled:opacity-40"
        >
          <X className="h-7 w-7" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => decide("like")}
          disabled={!!exit}
          aria-label="Like — add to shortlist"
          title="Like (→)"
          className="grid h-16 w-16 place-items-center rounded-full bg-teal-700 text-white shadow-lg shadow-teal-900/30 transition hover:scale-105 hover:bg-teal-800 active:scale-95 disabled:opacity-40"
        >
          <Heart className="h-7 w-7" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => setInfo((v) => !v)}
          aria-label="Show details"
          title="Details (↑)"
          className={cn(
            "grid h-12 w-12 place-items-center rounded-full border shadow-sm transition",
            info ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800",
          )}
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        {cards.length} left ·{" "}
        <Link href={shortlistHref} className="font-medium text-teal-700 hover:underline">
          {liked} shortlisted
        </Link>
        <span className="hidden sm:inline"> · drag the card or use ← → keys · tap a photo to see the next one</span>
      </p>
      {saveError && <p className="mt-2 text-center text-xs text-red-600">{saveError}</p>}
    </div>
  );
}

function CardFace({
  listing,
  photo,
  info,
  onToggleInfo,
  likeOpacity,
  passOpacity,
  priority,
}: {
  listing: ListingWithAgent;
  photo: number;
  info: boolean;
  onToggleInfo?: () => void;
  likeOpacity: number;
  passOpacity: number;
  priority?: boolean;
}) {
  const url = listing.photo_urls[photo] ?? null;
  const n = listing.photo_urls.length;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-slate-900 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)] ring-1 ring-black/10">
      {url ? (
        <Image
          src={url}
          alt=""
          fill
          sizes="(min-width: 1024px) 440px, 100vw"
          className="object-cover"
          priority={priority}
          draggable={false}
        />
      ) : (
        <div className="grid h-full place-items-center text-slate-600">
          <ImageOff className="h-10 w-10" />
        </div>
      )}

      {n > 1 && (
        <div className="absolute inset-x-3 top-3 flex gap-1">
          {listing.photo_urls.map((_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full transition", i === photo ? "bg-white" : "bg-white/35")} />
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

      {/* Decision stamps */}
      <div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-9 -rotate-12 rounded-lg border-[3px] border-emerald-400 px-3 py-0.5 text-3xl font-black uppercase tracking-[0.2em] text-emerald-400 drop-shadow"
      >
        Like
      </div>
      <div
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute right-5 top-9 rotate-12 rounded-lg border-[3px] border-rose-400 px-3 py-0.5 text-3xl font-black uppercase tracking-[0.2em] text-rose-400 drop-shadow"
      >
        Pass
      </div>

      {/* Summary */}
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-3xl font-semibold tracking-tight drop-shadow">{formatPrice(listing.price, listing.currency)}</p>
            <p className="mt-0.5 truncate text-base font-medium text-white/95">{listing.title}</p>
            <p className="text-sm text-white/75">
              {listing.property_type} · {listing.locality}
              {listing.region ? `, ${listing.region}` : ""}
            </p>
          </div>
          {onToggleInfo && (
            <button
              type="button"
              onPointerDown={stop}
              onClick={onToggleInfo}
              aria-label="Details"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur transition hover:bg-white/30"
            >
              <Info className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {listing.bedrooms != null && (
            <Chip className="border-white/20 bg-white/15 text-white backdrop-blur">
              <BedDouble className="h-3.5 w-3.5" /> {listing.bedrooms} bed
            </Chip>
          )}
          {listing.bathrooms != null && (
            <Chip className="border-white/20 bg-white/15 text-white backdrop-blur">
              <Bath className="h-3.5 w-3.5" /> {listing.bathrooms} bath
            </Chip>
          )}
          {listing.size_sqm != null && (
            <Chip className="border-white/20 bg-white/15 text-white backdrop-blur">
              <Ruler className="h-3.5 w-3.5" /> {formatNumber(listing.size_sqm, " m²")}
            </Chip>
          )}
          {listing.outdoor_sqm != null && (
            <Chip className="border-white/20 bg-white/15 text-white backdrop-blur">
              <Trees className="h-3.5 w-3.5" /> {formatNumber(listing.outdoor_sqm, " m²")} out
            </Chip>
          )}
          {listing.features.slice(0, 3).map((f) => (
            <Chip key={f} className="border-white/20 bg-white/15 text-white backdrop-blur">
              {f}
            </Chip>
          ))}
          {listing.features.length > 3 && <Chip className="border-white/20 bg-white/15 text-white backdrop-blur">+{listing.features.length - 3}</Chip>}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          {listing.agents ? <AnonBadge code={listing.agents.anon_code} verified={listing.agents.verified} prefix="Listing Agent" light /> : <span />}
          <span className="rounded-full bg-teal-500/90 px-2.5 py-1 text-xs font-semibold text-white">{listing.buyer_agent_commission_pct}% to buyer agent</span>
        </div>
      </div>

      {/* Details overlay */}
      {info && (
        <div onPointerDown={stop} className="absolute inset-0 overflow-y-auto bg-slate-950/92 p-5 text-white backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold tracking-tight">{formatPrice(listing.price, listing.currency)}</p>
              <p className="mt-0.5 text-sm text-white/80">{listing.title}</p>
            </div>
            <button
              type="button"
              onClick={onToggleInfo}
              aria-label="Close details"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-white/60">Type</dt>
            <dd>{listing.property_type}</dd>
            <dt className="text-white/60">Locality</dt>
            <dd>
              {listing.locality}
              {listing.region ? `, ${listing.region}` : ""}
            </dd>
            <dt className="text-white/60">Bedrooms</dt>
            <dd>{listing.bedrooms ?? "—"}</dd>
            <dt className="text-white/60">Bathrooms</dt>
            <dd>{listing.bathrooms ?? "—"}</dd>
            <dt className="text-white/60">Internal</dt>
            <dd>{listing.size_sqm != null ? formatNumber(listing.size_sqm, " m²") : "—"}</dd>
            <dt className="text-white/60">Outdoor</dt>
            <dd>{listing.outdoor_sqm != null ? formatNumber(listing.outdoor_sqm, " m²") : "—"}</dd>
            <dt className="text-white/60">Commission</dt>
            <dd>{listing.buyer_agent_commission_pct}% to buyer agent</dd>
          </dl>
          {listing.features.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {listing.features.map((f) => (
                <li key={f} className="rounded-full border border-white/20 px-2.5 py-1 text-xs">
                  {f}
                </li>
              ))}
            </ul>
          )}
          {listing.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/85">{listing.description}</p>}
          <p className="mt-4 text-xs text-white/50">Exact address and the agent&apos;s identity are revealed only inside an agreed Deal Room.</p>
          <Link
            href={`/listings/${listing.id}`}
            target="_blank"
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Open full listing <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
