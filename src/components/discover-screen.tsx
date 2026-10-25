"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Flame, Heart, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The swipe experience's frame. On phones it takes the whole screen (over the
 * app shell, like a camera or a map) with a thin top bar; on large screens it
 * is an ordinary page section with tabs. The client brief and its filters
 * live in a settings sheet either way.
 */
export function DiscoverScreen({
  tab,
  briefTitle,
  summary,
  likedCount,
  shortlistHref,
  swipeHref,
  settings,
  children,
}: {
  tab: "swipe" | "shortlist";
  briefTitle: string;
  summary: string;
  likedCount: number;
  shortlistHref: string;
  swipeHref: string;
  settings: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      setOpen(false);
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, []);

  const tabClass = (active: boolean) =>
    cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition", active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900");

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-limestone lg:static lg:z-auto lg:block lg:bg-transparent">
      {/* Phone top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 px-3 pt-[env(safe-area-inset-top)] lg:hidden">
        <Link href="/dashboard" aria-label="Back to dashboard" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition active:scale-95">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-brief-trigger
          className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 text-left transition active:scale-[0.98]"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium leading-tight text-ink">{briefTitle}</span>
            <span className="block truncate text-[11px] leading-tight text-ink/60">{summary}</span>
          </span>
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-ink/60" />
        </button>
        <Link
          href={tab === "shortlist" ? swipeHref : shortlistHref}
          aria-label={tab === "shortlist" ? "Back to swiping" : `Shortlist, ${likedCount} saved`}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition active:scale-95",
            tab === "shortlist" ? "bg-brand-700 text-white" : "bg-white/80 text-ink ring-1 ring-ink/10",
          )}
        >
          {tab === "shortlist" ? <Flame className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
          {tab === "shortlist" ? "Swipe" : likedCount}
        </Link>
      </header>

      {/* Desktop toolbar */}
      <div className="mb-5 hidden items-center justify-between gap-3 lg:flex">
        <div className="flex w-fit gap-1 rounded-xl bg-slate-200/60 p-1">
          <Link href={swipeHref} className={tabClass(tab === "swipe")}>
            <Flame className="h-4 w-4" /> Swipe
          </Link>
          <Link href={shortlistHref} className={tabClass(tab === "shortlist")}>
            <Heart className="h-4 w-4" /> Shortlist
            {likedCount > 0 && <span className={cn("rounded-full px-1.5 text-[11px]", tab === "shortlist" ? "bg-brand-700 text-white" : "bg-slate-300/70 text-slate-700")}>{likedCount}</span>}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-brief-trigger
          className="inline-flex h-10 max-w-[60%] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm transition hover:border-slate-300 active:scale-[0.98]"
        >
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          <span className="truncate">
            <span className="font-medium">{briefTitle}</span>
            <span className="text-slate-500"> — {summary}</span>
          </span>
        </button>
      </div>

      {/* Content */}
      <div className={cn("min-h-0 flex-1 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] lg:block lg:px-0 lg:pb-0", tab === "swipe" ? "flex flex-col overflow-hidden lg:overflow-visible" : "overflow-y-auto")} style={{ overscrollBehavior: "contain" }}>
        {children}
      </div>

      {/* Brief settings sheet */}
      <dialog
        ref={dialog}
        aria-label="Client brief"
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="sheet fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none overflow-hidden rounded-t-[24px] bg-limestone p-0 text-ink shadow-2xl lg:inset-0 lg:m-auto lg:h-fit lg:w-[min(100vw-2rem,960px)] lg:rounded-[24px]"
      >
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3 sm:px-5">
            <h2 className="text-base font-semibold">Client brief</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full text-ink/70 transition hover:bg-ink/5 active:scale-95">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto p-4 sm:p-5" style={{ overscrollBehavior: "contain" }}>
            {settings}
          </div>
          <div className="border-t border-ink/10 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-5">
            <button type="button" onClick={() => setOpen(false)} className="h-11 w-full rounded-full bg-brand-700 text-[15px] font-medium text-white transition hover:bg-brand-800 active:scale-[0.98]">
              Show matches
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
