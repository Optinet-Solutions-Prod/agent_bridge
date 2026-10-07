"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Flame, Handshake, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/listings", label: "Inventory", short: "Inventory", icon: Building2 },
  { href: "/discover", label: "Swipe matches", short: "Swipe", icon: Flame },
  { href: "/requests", label: "Buyer requests", short: "Buyers", icon: Users },
  { href: "/messages", label: "Messages", short: "Messages", icon: MessageSquare },
  { href: "/deals", label: "Deal Rooms", short: "Deals", icon: Handshake },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
] as const;

const TAB_HREFS: readonly string[] = ["/dashboard", "/listings", "/discover", "/messages", "/deals"];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Vertical navigation for the dark desktop sidebar. */
export function SidebarNav() {
  const isActive = useActive();
  return (
    <>
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", active ? "text-teal-300" : "")} />
            {label}
            {href === "/discover" && !active && (
              <span className="ml-auto rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-300">
                New
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

/** Bottom tab bar for phones. The Swipe tab is raised like a primary action. */
export function TabBarNav() {
  const isActive = useActive();
  return (
    <>
      {NAV_LINKS.filter((l) => TAB_HREFS.includes(l.href)).map(({ href, short, icon: Icon }) => {
        const active = isActive(href);
        const primary = href === "/discover";
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition",
              active ? "text-teal-700" : "text-slate-500",
            )}
          >
            {primary ? (
              <span
                className={cn(
                  "-mt-6 grid h-12 w-12 place-items-center rounded-full text-white shadow-lg shadow-teal-900/25 ring-4 ring-[#f5f6f8]",
                  active ? "bg-teal-800" : "bg-teal-700",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
            ) : (
              <Icon className="h-5 w-5" />
            )}
            {short}
          </Link>
        );
      })}
    </>
  );
}
