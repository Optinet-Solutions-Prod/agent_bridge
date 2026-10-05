import Link from "next/link";
import { Check, EyeOff, Lock, MessageSquareLock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui";
import { APP_NAME, APP_TAGLINE, PLANS, PLATFORM_FEE_PCT } from "@/lib/constants";
import { getUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getUser().catch(() => null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            {user ? (
              <LinkButton href="/dashboard">Open dashboard</LinkButton>
            ) : (
              <>
                <LinkButton href="/login" variant="ghost">
                  Log in
                </LinkButton>
                <LinkButton href="/signup">Join the network</LinkButton>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-900 text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-teal-300">Malta · agents only</p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{APP_TAGLINE}</h1>
              <p className="mt-5 max-w-xl text-lg text-slate-300">
                Share the stock you hold with every other agency — without exposing the address, the owner or your name.
                Match buyers to inventory, chat anonymously, and reveal only after co-broker terms are locked in.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/signup" size="lg">
                  Create your agent profile
                </LinkButton>
                <LinkButton href="/pricing" size="lg" variant="secondary">
                  See pricing
                </LinkButton>
              </div>
            </div>

            {/* Anonymised listing mock */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-medium text-teal-200">Live listing</span>
                <span className="font-mono text-xs text-slate-300">Listing Agent #MT18472</span>
              </div>
              <p className="mt-4 text-3xl font-semibold">€750,000</p>
              <p className="mt-1 text-slate-200">3-bed apartment · Sliema · 160 m²</p>
              <ul className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
                {["Sea view", "2 parking spaces", "Lift", "Highly finished"].map((f) => (
                  <li key={f} className="rounded-full border border-white/15 px-2.5 py-1">
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-lg bg-black/30 p-3 text-sm">
                <p className="flex items-center gap-2 text-teal-200">
                  <Check className="h-4 w-4" /> Buyer-agent commission: 2.5%
                </p>
                <p className="mt-2 flex items-center gap-2 text-slate-400">
                  <EyeOff className="h-4 w-4" /> Exact address, agency and contact hidden until a Deal Room is agreed
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How {APP_NAME} works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: EyeOff,
                title: "1. List anonymously",
                body: "Upload your inventory with price, type, size, locality, features and the buyer-agent commission you offer. The exact address and your identity stay private.",
              },
              {
                icon: MessageSquareLock,
                title: "2. Match and chat",
                body: "Other agents find your stock through search and buyer requests. They message you as Agent #MT… and you reply the same way — nobody knows who's who.",
              },
              {
                icon: Lock,
                title: "3. Lock terms, then reveal",
                body: `When there's a real buyer, open a Deal Room. Both sides accept the co-broker split and the ${PLATFORM_FEE_PCT}% platform fee digitally. Only then are names, contacts and the address revealed.`,
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-6 w-6 text-teal-700" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What is and isn't visible */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Nobody gets bypassed</h2>
              <p className="mt-3 text-slate-600">
                The platform controls the introduction. Privacy is enforced in the database, not just hidden in the interface, so
                there is no way to scrape an address or a phone number before terms are agreed.
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                Once both agents accept, the agreed commission split and platform fee apply even if the rest of the conversation
                happens outside {APP_NAME}.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-900">Other agents see</p>
                <ul className="mt-3 space-y-1.5 text-sm text-emerald-900/80">
                  {["Price & commission offered", "Type, beds, baths, m²", "Locality (town) & region", "Features & photos", "Your anonymous ID"].map((i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Hidden until a Deal Room is agreed</p>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  {["Your name & agency", "Phone & email", "Exact address or building", "Map pin", "Viewing arrangements"].map((i) => (
                    <li key={i} className="flex gap-2">
                      <EyeOff className="mt-0.5 h-4 w-4 shrink-0" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Simple pricing</h2>
            <Link href="/pricing" className="text-sm font-medium text-teal-700 hover:underline">
              Full details →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((key) => {
              const plan = PLANS[key];
              return (
                <div key={key} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">{plan.name}</p>
                  <p className="mt-1 text-3xl font-semibold">
                    {plan.priceMonthly === 0 ? "€0" : `€${plan.priceMonthly}`}
                    <span className="text-sm font-normal text-slate-500">/month</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{plan.blurb}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Plus a success fee of {PLATFORM_FEE_PCT}% of the buyer-side commission on deals introduced through {APP_NAME}.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <span>Built for licensed real-estate agents.</span>
        </div>
      </footer>
    </div>
  );
}
