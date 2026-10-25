"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Collapsed behind a button on phones, always open from `sm` up. Server-renders
 * closed, so the first tap works before hydration finishes… the panel's own
 * `sm:` display class keeps desktop unaffected.
 */
export function MobileCollapse({
  label,
  openLabel = label,
  className,
  panelClassName,
  children,
}: {
  label: string;
  openLabel?: string;
  className?: string;
  /** Display classes for the open panel, e.g. "grid gap-3 sm:grid-cols-2". */
  panelClassName: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `collapse-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="mb-3 inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition active:scale-[0.98] sm:hidden"
      >
        {open ? openLabel : label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      <div id={panelId} className={cn(open ? panelClassName : `hidden ${panelClassName.replace(/\bgrid\b/, "sm:grid").replace(/\bflex\b/, "sm:flex")}`)}>
        {children}
      </div>
    </div>
  );
}
