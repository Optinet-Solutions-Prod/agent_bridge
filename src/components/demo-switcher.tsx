"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Loader2, UserRoundCog } from "lucide-react";
import { switchDemoAgent } from "@/app/auth/actions";
import { DEMO_AGENTS, demoAgentFor } from "@/lib/demo";
import { cn } from "@/lib/utils";

function Select({ currentEmail, dark, compact }: { currentEmail: string | null; dark?: boolean; compact?: boolean }) {
  const { pending } = useFormStatus();
  const current = demoAgentFor(currentEmail);
  return (
    <div className="relative">
      <select
        name="email"
        aria-label="Act as demo agent"
        defaultValue={current?.email ?? "__current"}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={cn(
          compact ? "!h-8 !w-auto max-w-[190px] !rounded-full !pl-3 !pr-8 text-xs" : "!h-9 text-sm",
          dark && "!border-white/15 !bg-white/5 !text-white [&>option]:text-slate-900",
        )}
      >
        {!current && currentEmail && (
          <option value="__current" disabled>
            Your account ({currentEmail})
          </option>
        )}
        {DEMO_AGENTS.map((a) => (
          <option key={a.email} value={a.email}>
            {a.name} · {a.agency}
          </option>
        ))}
        <option value="__own">Use my own login…</option>
      </select>
      {pending && <Loader2 className={cn("pointer-events-none absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin", dark ? "text-white/70" : "text-slate-400")} />}
    </div>
  );
}

/** Demo mode: switch which seeded agent you are acting as (no login needed). */
export function DemoSwitcher({ currentEmail, dark, compact }: { currentEmail: string | null; dark?: boolean; compact?: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const next = search ? `${pathname}?${search}` : pathname;
  return (
    <form action={switchDemoAgent}>
      <input type="hidden" name="next" value={next} />
      {!compact && (
        <p className={cn("mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide", dark ? "text-slate-500" : "text-slate-500")}>
          <UserRoundCog className="h-3.5 w-3.5" /> Demo · act as
        </p>
      )}
      <Select currentEmail={currentEmail} dark={dark} compact={compact} />
    </form>
  );
}
