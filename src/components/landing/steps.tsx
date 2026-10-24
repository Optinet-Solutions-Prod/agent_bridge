import { PLATFORM_FEE_PCT } from "@/lib/constants";

const STEPS = [
  {
    title: "An agency lists a home",
    body: "Price, type, size, locality, photos and the buyer-agent commission. The address and the agency stay private.",
  },
  {
    title: "Buyers' agents swipe for their clients",
    body: "Each client brief becomes a deck of matching homes. A right swipe shortlists; competing interest is visible to the listing agent.",
  },
  {
    title: "They talk as Agent #…",
    body: "Questions, viewings and offers happen in an anonymous chat. Nobody knows which agency is on the other side.",
  },
  {
    title: "Terms are agreed, then everything is revealed",
    body: `A Deal Room records the commission split and the ${PLATFORM_FEE_PCT}% platform fee. Once both accept, names, phone numbers and the exact address unlock.`,
  },
];

/** This is a real sequence, so the numbers carry meaning. */
export function Steps() {
  return (
    <section aria-labelledby="steps-heading" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <h2 id="steps-heading" className="max-w-[20ch] font-display text-[2rem] leading-[1.08] tracking-tight sm:text-[2.6rem]">
        How a home goes from one agency&apos;s window to another agency&apos;s buyer
      </h2>
      <ol className="mt-10 grid gap-8 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative border-t border-brand-700/30 pt-5">
            <span className="font-display text-[1.6rem] leading-none text-brand-700" aria-hidden>
              {i + 1}
            </span>
            <h3 className="mt-3 text-[17px] font-medium leading-snug">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </h3>
            <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-ink/80">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
