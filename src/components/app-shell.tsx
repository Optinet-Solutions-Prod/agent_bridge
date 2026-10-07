import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { SidebarNav, TabBarNav } from "@/components/nav-links";
import { AnonBadge, LinkButton } from "@/components/ui";
import { PLANS } from "@/lib/constants";
import type { Agent } from "@/lib/types";

export function AppShell({ agent, children }: { agent: Agent; children: React.ReactNode }) {
  const plan = PLANS[agent.plan];

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-950 text-white lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo href="/dashboard" light />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          <SidebarNav />
        </nav>
        <div className="px-3 pb-3">
          <LinkButton href="/listings/new" className="w-full">
            <Plus className="h-4 w-4" /> New listing
          </LinkButton>
        </div>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">You appear as</p>
              <div className="mt-1.5">
                <AnonBadge code={agent.anon_code} verified={agent.verified} light />
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                title="Log out"
                aria-label="Log out"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">{plan.name} plan</span>
            {agent.plan === "free" && (
              <Link href="/pricing" className="font-medium text-teal-300 hover:underline">
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-1.5">
          <AnonBadge code={agent.anon_code} verified={agent.verified} prefix="You" />
          <form action={signOut}>
            <button type="submit" aria-label="Log out" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>
      </div>

      {/* Phone bottom tabs */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <TabBarNav />
      </nav>
    </div>
  );
}
