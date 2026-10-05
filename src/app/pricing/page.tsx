import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui";
import { APP_NAME, PLANS, PLATFORM_FEE_PCT } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pricing" };

// Worked example from the business case.
const EXAMPLE_PRICE = 600_000;
const EXAMPLE_TOTAL_COMMISSION_PCT = 4;
const EXAMPLE_TOTAL = (EXAMPLE_PRICE * EXAMPLE_TOTAL_COMMISSION_PCT) / 100;
const EXAMPLE_PER_SIDE = EXAMPLE_TOTAL / 2;
const EXAMPLE_FEE_PER_SIDE = (EXAMPLE_PER_SIDE * PLATFORM_FEE_PCT) / 100;

export default async function PricingPage() {
  const user = await getUser().catch(() => null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <LinkButton href={user ? "/dashboard" : "/signup"}>{user ? "Open dashboard" : "Join the network"}</LinkButton>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Subscriptions keep the lights on; the success fee is only charged when {APP_NAME} actually creates a deal between two
          agents.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((key) => {
            const plan = PLANS[key];
            const highlight = key === "pro";
            return (
              <div
                key={key}
                className={
                  highlight
                    ? "rounded-2xl border-2 border-teal-700 bg-white p-6 shadow-md"
                    : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                }
              >
                <p className="text-sm font-medium text-slate-500">{plan.name}</p>
                <p className="mt-2 text-4xl font-semibold">
                  €{plan.priceMonthly}
                  <span className="text-base font-normal text-slate-500">/month</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">{plan.blurb}</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-700">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" /> {perk}
                    </li>
                  ))}
                </ul>
                <LinkButton href={user ? "/settings" : "/signup"} className="mt-6 w-full" variant={highlight ? "primary" : "secondary"}>
                  {plan.priceMonthly === 0 ? "Start free" : `Choose ${plan.name}`}
                </LinkButton>
              </div>
            );
          })}
        </div>

        <section className="mt-14 grid gap-8 rounded-2xl border border-slate-200 bg-white p-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Success fee: {PLATFORM_FEE_PCT}% of the buyer-side commission</h2>
            <p className="mt-3 text-sm text-slate-600">
              When two agents connect through a Deal Room and the transaction completes, each participating side pays{" "}
              {PLATFORM_FEE_PCT}% of the buyer-agent commission to {APP_NAME}. Both agents accept this digitally before any identity
              or address is revealed, so the fee applies even if the rest of the deal is handled offline.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-5 text-sm">
            <p className="font-medium text-slate-900">Worked example</p>
            <dl className="mt-3 space-y-2 text-slate-700">
              <div className="flex justify-between">
                <dt>Sale price</dt>
                <dd className="font-medium">{formatPrice(EXAMPLE_PRICE)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Total agency commission ({EXAMPLE_TOTAL_COMMISSION_PCT}%)</dt>
                <dd className="font-medium">{formatPrice(EXAMPLE_TOTAL)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Split 50/50 → each side</dt>
                <dd className="font-medium">{formatPrice(EXAMPLE_PER_SIDE)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <dt>{APP_NAME} fee per side ({PLATFORM_FEE_PCT}%)</dt>
                <dd className="font-semibold text-teal-800">{formatPrice(EXAMPLE_FEE_PER_SIDE)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Platform revenue on this deal</dt>
                <dd className="font-semibold text-teal-800">{formatPrice(EXAMPLE_FEE_PER_SIDE * 2)}</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
    </div>
  );
}
