import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "register", href: "/leads", label: "Holiday rentals", hint: "RNAL register" },
  { key: "tourism", href: "/leads/tourism", label: "Tourist properties", hint: "RNET register" },
  { key: "listings", href: "/leads/listings", label: "Portal listings", hint: "OLX private sellers" },
  { key: "sources", href: "/leads/sources", label: "Sources", hint: "Where the data comes from" },
] as const;

/** Switch between lead sources. */
export function LeadsTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <nav aria-label="Lead source" className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex min-w-full gap-1 rounded-2xl bg-slate-100 p-1 sm:min-w-0">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={active === t.key ? "page" : undefined}
            className={cn("shrink-0 rounded-xl px-4 py-2 text-left transition", active === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            <span className="block whitespace-nowrap text-sm font-semibold">{t.label}</span>
            <span className="block whitespace-nowrap text-xs text-slate-500">{t.hint}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** One line under a page header naming the source, with links and the check date. */
export function SourceLine({ label, publisher, links, checkedOn }: { label: string; publisher: string; links: { href: string; text: string }[]; checkedOn?: string | null }) {
  return (
    <p className="-mt-3 mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">Source</span>
      <span>
        {label} · {publisher}
      </span>
      {links.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
          {l.text} <ExternalLink className="h-3 w-3" />
        </a>
      ))}
      {checkedOn && <span>· checked {formatDate(checkedOn)}</span>}
    </p>
  );
}
