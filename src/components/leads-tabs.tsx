import Link from "next/link";
import { cn } from "@/lib/utils";

/** Switch between the two lead sources: the official register and portal listings. */
export function LeadsTabs({ active }: { active: "register" | "listings" }) {
  const tabs = [
    { key: "register", href: "/leads", label: "Registered owners", hint: "Official holiday-rental register" },
    { key: "listings", href: "/leads/listings", label: "Portal listings", hint: "OLX private sellers" },
  ] as const;
  return (
    <nav aria-label="Lead source" className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:inline-grid sm:w-auto">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "rounded-xl px-4 py-2 text-left transition",
            active === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
          )}
        >
          <span className="block text-sm font-semibold">{t.label}</span>
          <span className="block text-xs text-slate-500">{t.hint}</span>
        </Link>
      ))}
    </nav>
  );
}
