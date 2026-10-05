"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Handshake, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/listings", label: "Inventory", icon: Building2 },
  { href: "/requests", label: "Buyer requests", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/deals", label: "Deal Rooms", icon: Handshake },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </>
  );
}
