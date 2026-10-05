import { LogOut, Plus } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { AnonBadge, Badge, LinkButton } from "@/components/ui";
import { PLANS } from "@/lib/constants";
import type { Agent } from "@/lib/types";

export function AppShell({ agent, children }: { agent: Agent; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="border-b border-slate-200 bg-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <Logo href="/dashboard" />
          <div className="lg:hidden">
            <AnonBadge code={agent.anon_code} verified={agent.verified} prefix="You" />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3 lg:pb-0">
          <NavLinks />
        </nav>
        <div className="hidden border-t border-slate-200 p-4 lg:block">
          <LinkButton href="/listings/new" className="w-full">
            <Plus className="h-4 w-4" /> New listing
          </LinkButton>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden h-16 items-center justify-end gap-3 border-b border-slate-200 bg-white px-6 lg:flex">
          <Badge tone={agent.plan === "free" ? "neutral" : "teal"}>{PLANS[agent.plan].name} plan</Badge>
          <span className="text-sm text-slate-500">You appear as</span>
          <AnonBadge code={agent.anon_code} verified={agent.verified} />
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
