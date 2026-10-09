"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowUpRight,
  Bath,
  BedDouble,
  Check,
  Flame,
  Heart,
  ImageOff,
  Info,
  MessageSquare,
  PartyPopper,
  RotateCcw,
  Ruler,
  Trees,
  X,
} from "lucide-react";
import { recordSwipe, undoSwipe } from "@/app/(app)/discover/actions";
import { startConversation } from "@/app/(app)/listings/actions";
import { SubmitButton } from "@/components/submit-button";
import { AnonBadge, Chip } from "@/components/ui";
import { formatNumber, formatPrice } from "@/lib/format";
import type { ListingWithAgent, SwipeDecision } from "@/lib/types";
import { cn } from "@/lib/utils";

const THRESHOLD = 110; // px of horizontal drag that counts as a decision
// A decision plays in two beats so it can actually be read: the card holds in
// place while the stamp and splash pop in, then it flies off.
const HOLD_MS = 650;
const FLY_MS = 600;
const TAP_SLOP = 6;
const TOAST_MS = 2400;

type Gone = { listing: ListingWithAgent; decision: SwipeDecision };
type Toast = { decision: SwipeDecision; id: number };
type Match = { listing: ListingWithAgent; others: number };

const stop = (e: ReactPointerEvent) => e.stopPropagation();

export function SwipeDeck({
  listings,
  requestId,
  likedCount: initialLiked,
  shortlistHref,
  interest,
}: {
  listings: ListingWithAgent[];
  requestId: string | null;
  likedCount: number;
  shortlistHref: string;
  /** listingId -> how many OTHER agents already shortlisted it. */
  interest: Record<string, number>;
}) {
  const [cards, setCards] = useState(listings);
  const [gone, setGone] = useState<Gone[]>([]);
  const [liked, setLiked] = useState(initialLiked);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<SwipeDecision | null>(null);
  const [flying, setFlying] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [info, setInfo] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = useRef(false);
  const toastTimer = useRef<number | null>(null);

  const top = cards[0];

  const decide = useCallback(
    (decision: SwipeDecision) => {
      if (!top || exit || match) return;
      const current = top;
      setExit(decision);
      setFlying(false);
      recordSwipe(current.id, requestId, decision)
        .then((r) => {
          if (r.error) setSaveError(r.error);
        })
        .catch(() => setSaveError("That swipe could not be saved. Check your connection."));

      window.setTimeout(() => setFlying(true), HOLD_MS);
      window.setTimeout(() => {
        setCards((c) => c.filter((l) => l.id !== current.id));
        setGone((g) => [...g, { listing: current, decision }]);
        if (decision === "like") setLiked((n) => n + 1);
        setExit(null);
        setFlying(false);
        setDrag({ x: 0, y: 0 });
        setPhoto(0);
        setInfo(false);

        setToast({ decision, id: Date.now() });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);

        const others = interest[current.id] ?? 0;
        if (decision === "like" && others > 0) setMatch({ listing: current, others });
      }, HOLD_MS + FLY_MS);
    },
    [top, exit, match, requestId, interest],
  );

  const undo = useCallback(() => {
    const last = gone[gone.length - 1];
    if (!last || exit) return;
    setGone((g) => g.slice(0, -1));
    setCards((c) => [last.listing, ...c]);
    if (last.decision === "like") setLiked((n) => Math.max(0, n - 1));
    setPhoto(0);
    setInfo(false);
    setToast(null);
    undoSwipe(last.listing.id, requestId).catch(() => {});
  }, [gone, exit, requestId]);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  // Keyboard: ← not interested, → interested, ↑ details, ↓ close, space next photo, z / backspace undo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement) return;
      if (match) {
        if (e.key === "Escape") setMatch(null);
        return;
      }
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
  }, [decide, undo, top, match]);

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

  const likeOpacity = exit === "like" ? 1 : Math.min(1, Math.max(0, drag.x / 80));
  const passOpacity = exit === "pass" ? 1 : Math.min(1, Math.max(0, -drag.x / 80));
  let transform = `translate3d(${drag.x}px, ${drag.y * 0.25}px, 0) rotate(${drag.x / 18}deg)`;
  let opacity = 1;
  let transition = dragging ? "none" : "transform 320ms cubic-bezier(.2,.8,.2,1), opacity 320ms ease";
  if (exit) {
    const dir = exit === "like" ? 1 : -1;
    if (!flying) {
      // Beat 1: hold where the finger let go, nudged towards the decision, slightly lifted.
      transform = `translate3d(${drag.x + dir * 24}px, ${drag.y * 0.25 - 10}px, 0) rotate(${drag.x / 18 + dir * 4}deg) scale(1.03)`;
      transition = "transform 380ms cubic-bezier(.2,.8,.2,1)";
    } else {
      // Beat 2: fly off screen.
      const fly = typeof window === "undefined" ? 900 : window.innerWidth + 240;
      transform = `translate3d(${dir * fly}px, ${drag.y * 0.25 - 90}px, 0) rotate(${dir * 32}deg)`;
      opacity = 0;
      transition = `transform ${FLY_MS}ms cubic-bezier(.45,0,.85,.4), opacity ${FLY_MS}ms ease-in`;
    }
  }

  return (
    <div className="mx-auto w-full max-w-[440px]">
      {top ? (
        <>
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
                    style={{ transform, opacity, transition, zIndex: 3 }}
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
                      others={interest[listing.id] ?? 0}
                      onToggleInfo={() => setInfo((v) => !v)}
                      likeOpacity={likeOpacity}
                      passOpacity={passOpacity}
                      flash={exit}
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
                    <CardFace listing={listing} photo={0} info={false} others={interest[listing.id] ?? 0} likeOpacity={0} passOpacity={0} flash={null} />
                  </div>
                ),
              )}

            {/* Big centred verdict while the card holds and flies */}
            {exit && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4">
                <div
                  role="status"
                  style={{ animation: "splash-in 520ms cubic-bezier(.2,.9,.3,1.25) both" }}
                  className={cn(
                    "flex max-w-full items-center gap-3 rounded-3xl px-6 py-4 text-2xl font-black uppercase tracking-wide text-white shadow-2xl ring-4 ring-white/40 sm:text-3xl",
                    exit === "like" ? "bg-emerald-500 shadow-emerald-900/50" : "bg-rose-500 shadow-rose-900/50",
                  )}
                >
                  {exit === "like" ? <Check className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" strokeWidth={3.5} /> : <X className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" strokeWidth={3.5} />}
                  {exit === "like" ? "Interested!" : "Not interested"}
                </div>
              </div>
            )}

            {/* Decision toast, floating over the deck */}
            {toast && (
              <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
                <div
                  key={toast.id}
                  role="status"
                  style={{ animation: "toast-in 240ms cubic-bezier(.2,.8,.2,1)" }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-xl ring-1 ring-white/20",
                    toast.decision === "like" ? "bg-emerald-600 shadow-emerald-900/40" : "bg-rose-600 shadow-rose-900/40",
                  )}
                >
                  {toast.decision === "like" ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={3} /> Interested! Added to your shortlist
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" strokeWidth={3} /> Not interested
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-start justify-center gap-4">
            <Control
              label="Undo"
              onClick={undo}
              disabled={gone.length === 0 || !!exit}
              title="Undo (Z)"
              className="h-12 w-12 border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-800"
            >
              <RotateCcw className="h-5 w-5" />
            </Control>
            <Control
              label="Not interested"
              onClick={() => decide("pass")}
              disabled={!!exit}
              title="Not interested (←)"
              className="h-16 w-16 border border-rose-200 bg-white text-rose-500 shadow-lg shadow-rose-900/10 hover:scale-105 hover:bg-rose-50"
            >
              <X className="h-7 w-7" strokeWidth={2.5} />
            </Control>
            <Control
              label="Interested"
              onClick={() => decide("like")}
              disabled={!!exit}
              title="Interested (→)"
              className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-teal-900/30 hover:scale-105"
            >
              <Heart className="h-7 w-7" strokeWidth={2.5} />
            </Control>
            <Control
              label="Details"
              onClick={() => setInfo((v) => !v)}
              title="Details (↑)"
              className={cn(
                "h-12 w-12 border shadow-sm",
                info ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              <Info className="h-5 w-5" />
            </Control>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            {cards.length} left ·{" "}
            <Link href={shortlistHref} className="font-medium text-teal-700 hover:underline">
              {liked} shortlisted
            </Link>
            <span className="hidden sm:inline"> · drag the card or use ← → keys · tap a photo to see the next one</span>
          </p>
          {saveError && <p className="mt-2 text-center text-xs text-red-600">{saveError}</p>}
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center" style={{ animation: "pop 400ms cubic-bezier(.2,.8,.2,1)" }}>
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
      )}

      {/* Match celebration */}
      {match && <MatchOverlay match={match} requestId={requestId} onClose={() => setMatch(null)} />}
    </div>
  );
}

function Control({
  label,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        aria-label={label}
        className={cn("grid place-items-center rounded-full transition active:scale-95 disabled:pointer-events-none disabled:opacity-40", className)}
        {...props}
      >
        {children}
      </button>
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

function Stamp({ tone, opacity, pop, children }: { tone: "green" | "red"; opacity: number; pop: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{ opacity, animation: pop ? "stamp-pop 460ms cubic-bezier(.2,.8,.2,1)" : undefined }}
      className={cn("pointer-events-none absolute top-14 z-[2]", tone === "green" ? "left-4" : "right-4")}
    >
      <span
        className={cn(
          "block rounded-xl border-4 px-3 py-1 text-2xl font-black uppercase leading-none tracking-wider drop-shadow-lg backdrop-blur-[2px]",
          tone === "green" ? "-rotate-12 border-emerald-400 bg-emerald-950/40 text-emerald-300" : "rotate-12 border-rose-400 bg-rose-950/40 text-rose-300",
        )}
      >
        {children}
      </span>
    </div>
  );
}

function CardFace({
  listing,
  photo,
  info,
  others,
  onToggleInfo,
  likeOpacity,
  passOpacity,
  flash,
  priority,
}: {
  listing: ListingWithAgent;
  photo: number;
  info: boolean;
  others: number;
  onToggleInfo?: () => void;
  likeOpacity: number;
  passOpacity: number;
  flash: SwipeDecision | null;
  priority?: boolean;
}) {
  const url = listing.photo_urls[photo] ?? null;
  const n = listing.photo_urls.length;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-slate-900 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.5)] ring-1 ring-black/10">
      {url ? (
        <Image src={url} alt="" fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover" priority={priority} draggable={false} />
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

      {others > 0 && (
        <div
          style={{ animation: "glow 2.2s ease-in-out infinite" }}
          className="absolute left-3 top-6 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg"
        >
          <Flame className="h-3.5 w-3.5" /> {others} other agent{others === 1 ? "" : "s"} interested
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

      {/* Colour flash when the decision lands */}
      {flash && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] rounded-3xl ring-[6px] ring-inset",
            flash === "like" ? "bg-emerald-400/20 ring-emerald-400" : "bg-rose-400/20 ring-rose-400",
          )}
        />
      )}

      {/* Decision stamps */}
      <Stamp tone="green" opacity={likeOpacity} pop={flash === "like"}>
        Interested!
      </Stamp>
      <Stamp tone="red" opacity={passOpacity} pop={flash === "pass"}>
        Not interested
      </Stamp>

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
        <div onPointerDown={stop} className="absolute inset-0 z-[3] overflow-y-auto bg-slate-950/92 p-5 text-white backdrop-blur-sm">
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
          {others > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-2.5 py-1 text-xs font-semibold text-orange-300 ring-1 ring-orange-400/40">
              <Flame className="h-3.5 w-3.5" /> {others} other agent{others === 1 ? " has" : "s have"} shortlisted this
            </p>
          )}
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

const CONFETTI_COLORS = ["#34d399", "#14b8a6", "#fbbf24", "#fb7185", "#60a5fa", "#c084fc"];

function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 42 }).map((_, i) => {
        const left = (i * 37 + 11) % 100;
        const delay = (i % 9) * 120;
        const duration = 2400 + (i % 6) * 300;
        const size = 6 + (i % 3) * 3;
        const drift = ((i * 29) % 160) - 80;
        return (
          <span
            key={i}
            className="absolute -top-6 rounded-[2px]"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.7,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              ["--drift" as string]: `${drift}px`,
              animation: `confetti-fall ${duration}ms ease-in ${delay}ms both`,
            }}
          />
        );
      })}
    </div>
  );
}

function MatchOverlay({ match, requestId, onClose }: { match: Match; requestId: string | null; onClose: () => void }) {
  const { listing, others } = match;
  const photo = listing.photo_urls[0];
  return (
    <div role="dialog" aria-modal="true" aria-label="More than one match" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <Confetti />
      <div style={{ animation: "pop 650ms cubic-bezier(.2,.8,.2,1) 150ms both" }} className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-teal-900/30">
          <PartyPopper className="h-8 w-8" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Interested!</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">You got more than one match!</h2>
        <p className="mt-2 text-sm text-slate-600">
          You and{" "}
          <strong className="text-slate-900">
            {others} other agent{others === 1 ? "" : "s"}
          </strong>{" "}
          are interested in this property. Move fast — message the listing agent before the others do.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left ring-1 ring-slate-200/70">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-200">
            {photo && <Image src={photo} alt="" fill sizes="80px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{formatPrice(listing.price, listing.currency)}</p>
            <p className="truncate text-sm text-slate-700">{listing.title}</p>
            <p className="text-xs text-slate-500">
              {listing.property_type} · {listing.locality}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <form action={startConversation.bind(null, listing.id, requestId)}>
            <SubmitButton className="w-full" pendingText="Opening chat…">
              <MessageSquare className="h-4 w-4" /> Message listing agent
            </SubmitButton>
          </form>
          <button type="button" onClick={onClose} className="h-10 rounded-xl text-sm font-medium text-slate-600 transition hover:bg-slate-100">
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  );
}
