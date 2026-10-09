import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, EyeOff, Flame, Heart, Lock, MessageSquareLock, ShieldCheck, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui";
import { APP_NAME, APP_TAGLINE, PLANS, PLATFORM_FEE_PCT } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/demo";
import { getUser } from "@/lib/supabase/server";

const HERO_PHOTO = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80";
const HERO_PHOTO_BACK = "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80";

export default async function HomePage() {
  const user = await getUser().catch(() => null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            {user ? (
              <LinkButton href="/dashboard">Open dashboard</LinkButton>
            ) : DEMO_MODE ? (
              <>
                <LinkButton href="/login" variant="ghost">
                  Log in
                </LinkButton>
                <LinkButton href="/dashboard">Open the app</LinkButton>
              </>
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
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-[640px] w-[640px] rounded-full bg-teal-500/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-48 right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-28">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-teal-300">
                Malta · agents only
              </p>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{APP_TAGLINE}</h1>
              <p className="mt-6 max-w-xl text-lg text-slate-300">
                Share the stock you hold with every other agency — without exposing the address, the owner or your name. Swipe
                through the network against each client&apos;s brief, chat anonymously, and reveal only after co-broker terms are locked in.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                {DEMO_MODE ? (
                  <LinkButton href="/discover" size="lg">
                    Try the demo — no login needed <ArrowRight className="h-4 w-4" />
                  </LinkButton>
                ) : (
                  <LinkButton href="/signup" size="lg">
                    Create your agent profile <ArrowRight className="h-4 w-4" />
                  </LinkButton>
                )}
                <LinkButton href="/pricing" size="lg" variant="secondary" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                  See pricing
                </LinkButton>
              </div>
              <ul className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                {["Address hidden until terms agreed", "Identity shown as Agent #MT…", `${PLATFORM_FEE_PCT}% success fee, locked before reveal`].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Swipe-card mock */}
            <div className="relative mx-auto h-[520px] w-full max-w-[380px]">
              <div className="absolute inset-0 translate-y-5 scale-[0.93] overflow-hidden rounded-3xl bg-slate-800 opacity-60 shadow-2xl">
                <Image src={HERO_PHOTO_BACK} alt="" fill sizes="380px" className="object-cover" />
              </div>
              <div className="absolute inset-0 overflow-hidden rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
                <Image src={HERO_PHOTO} alt="Living room of an anonymised listing" fill sizes="380px" priority className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-x-3 top-3 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full ${i === 1 ? "bg-white" : "bg-white/35"}`} />
                  ))}
                </div>
                <div
                  className="absolute left-5 top-9 -rotate-12 rounded-lg border-[3px] border-emerald-400 px-3 py-0.5 text-3xl font-black uppercase tracking-[0.2em] text-emerald-400"
                  style={{ animation: "stamp-in 700ms cubic-bezier(.2,.8,.2,1) 600ms both" }}
                >
                  Like
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-3xl font-semibold tracking-tight">€750,000</p>
                  <p className="mt-0.5 text-base font-medium">Bright 3-bed with sea views and two parking spaces</p>
                  <p className="text-sm text-white/75">Apartment · Sliema, Northern Harbour</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    {["3 bed", "2 bath", "160 m²", "Sea view", "Lift"].map((f) => (
                      <li key={f} className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 backdrop-blur">
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono ring-1 ring-white/20">Listing Agent #MT18472</span>
                    <span className="rounded-full bg-teal-500/90 px-2.5 py-1 font-semibold">2.5% to buyer agent</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-7 left-1/2 flex -translate-x-1/2 gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-rose-300/40 bg-slate-900 text-rose-400 shadow-lg">
                  <X className="h-6 w-6" strokeWidth={2.5} />
                </span>
                <span className="grid h-14 w-14 place-items-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-900/40">
                  <Heart className="h-6 w-6" strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">From anonymous stock to a signed co-broker deal</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {[
              {
                icon: EyeOff,
                title: "List anonymously",
                body: "Upload price, type, size, locality, features and the buyer-agent commission you offer. The address and your identity stay private.",
              },
              {
                icon: Flame,
                title: "Swipe for each client",
                body: "Enter a client's brief — beds, localities, budget — and swipe through every matching property on the network. Right builds a shortlist.",
              },
              {
                icon: MessageSquareLock,
                title: "Chat as Agent #MT…",
                body: "Message the listing agent straight from the shortlist. Nobody knows who's who until both sides want to proceed.",
              },
              {
                icon: Lock,
                title: "Lock terms, then reveal",
                body: `Open a Deal Room. Both agents accept the split and the ${PLATFORM_FEE_PCT}% platform fee digitally. Only then are names, contacts and the address revealed.`,
              },
            ].map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-slate-400">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What is and isn't visible */}
        <section className="border-y border-slate-200/80 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Privacy by design</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Nobody gets bypassed</h2>
              <p className="mt-4 text-slate-600">
                The platform controls the introduction. Privacy is enforced in the database, not just hidden in the interface, so
                there is no way to scrape an address or a phone number before terms are agreed.
              </p>
              <p className="mt-4 flex items-start gap-2 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                Once both agents accept, the agreed commission split and platform fee apply even if the rest of the conversation
                happens outside {APP_NAME}.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-900">Other agents see</p>
                <ul className="mt-3 space-y-1.5 text-sm text-emerald-900/80">
                  {["Price & commission offered", "Type, beds, baths, m²", "Locality (town) & region", "Features & photos", "Your anonymous ID"].map((i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
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
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Pricing</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Simple plans, one success fee</h2>
            </div>
            <Link href="/pricing" className="text-sm font-medium text-teal-700 hover:underline">
              Full details →
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((key) => {
              const plan = PLANS[key];
              const highlight = key === "pro";
              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-6 shadow-sm ${highlight ? "border-teal-600 bg-slate-950 text-white" : "border-slate-200/80 bg-white"}`}
                >
                  <p className={`text-sm font-medium ${highlight ? "text-teal-300" : "text-slate-500"}`}>{plan.name}</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {plan.priceMonthly === 0 ? "€0" : `€${plan.priceMonthly}`}
                    <span className={`text-sm font-normal ${highlight ? "text-slate-400" : "text-slate-500"}`}>/month</span>
                  </p>
                  <p className={`mt-1 text-sm ${highlight ? "text-slate-300" : "text-slate-600"}`}>{plan.blurb}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-sm text-slate-600">
            Plus a success fee of {PLATFORM_FEE_PCT}% of the buyer-side commission on deals introduced through {APP_NAME}.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <span>Built for licensed real-estate agents.</span>
        </div>
      </footer>
    </div>
  );
}
