import Image from "next/image";
import Link from "next/link";
import { Check, Heart, X } from "lucide-react";
import { DEMO_MODE } from "@/lib/demo";
import type { ShowcaseHome } from "@/data/portugal-showcase";
import { formatNumber, formatPrice } from "@/lib/format";

/** The committed colour: cobalt owns this whole region, not an accent on it. */
export function AgentsBand({ sample }: { sample: ShowcaseHome }) {
  return (
    <section id="agents" aria-labelledby="agents-heading" className="mt-20 bg-brand-800 text-limestone sm:mt-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <h2 id="agents-heading" className="font-display text-[2.1rem] leading-[1.06] tracking-tight sm:text-[2.8rem] lg:text-[3.4rem]">
            Agents: your stock in front of every agency&apos;s buyers, without giving anything away.
          </h2>
          <div className="mt-8 max-w-[52ch] space-y-5 text-[17px] leading-relaxed text-limestone/85">
            <p>
              <strong className="font-medium text-limestone">List once, anonymously.</strong> Price, type, size, locality, photos and the commission you offer. The
              street, the owner and your name stay private; that is enforced in the database, not just hidden on screen.
            </p>
            <p>
              <strong className="font-medium text-limestone">Swipe for each client.</strong> Enter a buyer&apos;s brief and go through every matching home on the
              network. Right means interested; when several agents want the same home, the listing agent sees it.
            </p>
            <p>
              <strong className="font-medium text-limestone">Terms before names.</strong> Chat as Agent #…, then open a Deal Room. Both sides accept the split and the platform
              terms digitally, and only then are names, contacts and the address revealed.
            </p>
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={DEMO_MODE ? "/discover" : "/signup"}
              className="inline-flex h-12 items-center rounded-full bg-limestone px-6 text-[15px] font-medium text-brand-900 transition hover:bg-white active:scale-[0.98]"
            >
              {DEMO_MODE ? "Try the swipe deck" : "Create your agent profile"}
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-full border border-limestone/30 px-6 text-[15px] font-medium text-limestone transition hover:border-limestone/60 active:scale-[0.98]"
            >
              Create an agent profile
            </Link>
          </div>
        </div>

        {/* The swipe card, as agents see it */}
        <div className="relative mx-auto h-[500px] w-full max-w-[360px] lg:h-[560px]">
          <div className="absolute inset-0 translate-y-4 scale-[0.94] overflow-hidden rounded-[28px] bg-brand-900/60 ring-1 ring-white/10" aria-hidden />
          <div className="absolute inset-0 overflow-hidden rounded-[28px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/15">
            <Image src={sample.photos[1] ?? sample.photos[0]} alt="" fill sizes="360px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
            <div className="absolute inset-x-3 top-3 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i === 0 ? "bg-limestone" : "bg-limestone/35"}`} />
              ))}
            </div>
            <div
              className="absolute left-5 top-12 -rotate-12 rounded-xl border-4 border-emerald-400 bg-emerald-950/40 px-3 py-1 text-2xl font-black uppercase tracking-wider text-emerald-300 backdrop-blur-[2px]"
              style={{ animation: "stamp-in 700ms var(--ease-out-strong) 400ms both" }}
            >
              Interested!
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="font-display text-[30px] leading-none tracking-tight">{formatPrice(sample.price)}</p>
              <p className="mt-2 text-[15px] font-medium">{sample.title}</p>
              <p className="text-[14px] text-limestone/75">
                {sample.type}, {sample.locality}
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5 text-[12px]">
                {[
                  sample.beds != null ? `${sample.beds} bed` : null,
                  sample.baths != null ? `${sample.baths} bath` : null,
                  sample.sqm != null ? formatNumber(sample.sqm, " m²") : null,
                  ...sample.features.slice(0, 2),
                ]
                  .filter(Boolean)
                  .map((f) => (
                    <li key={f as string} className="rounded-full border border-limestone/20 bg-limestone/15 px-2.5 py-1 backdrop-blur">
                      {f}
                    </li>
                  ))}
              </ul>
              <div className="mt-3 flex items-center justify-between text-[12px]">
                <span className="rounded-full bg-limestone/15 px-2.5 py-1 font-mono ring-1 ring-limestone/20">Listing Agent #{sample.agency}</span>
                <span className="rounded-full bg-emerald-700 px-2.5 py-1 font-semibold text-white">{sample.commissionPct}% to buyer agent</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-7 left-1/2 flex -translate-x-1/2 gap-4" aria-hidden>
            <span className="grid h-14 w-14 place-items-center rounded-full border border-rose-300/40 bg-brand-950 text-rose-400 shadow-lg">
              <X className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-black/30">
              <Heart className="h-6 w-6" strokeWidth={2.5} />
            </span>
          </div>
          <p className="sr-only">
            <Check className="inline h-4 w-4" /> Example of the swipe card agents use to shortlist homes for a client.
          </p>
        </div>
      </div>
    </section>
  );
}
