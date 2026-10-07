import { EyeOff, Lock, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { APP_NAME } from "@/lib/constants";

const POINTS = [
  { icon: EyeOff, text: "List stock without exposing the address, the owner or your agency." },
  { icon: Sparkles, text: "Swipe through the whole network's inventory against each client's brief." },
  { icon: Lock, text: "Co-broker terms are locked in before anyone is revealed." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-slate-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-teal-500/20 blur-3xl"
        />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-sky-500/10 blur-3xl" />
        <Logo light className="relative text-lg" />
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Malta · agents only</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">The private MLS where nobody gets bypassed.</h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-sm text-slate-300">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-teal-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} {APP_NAME}. Built for licensed real-estate agents.
        </p>
      </aside>

      {/* Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-16">
        <Logo className="mb-8 text-lg lg:hidden" />
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_12px_40px_-16px_rgba(16,24,40,0.2)] sm:p-9">
          {children}
        </div>
      </div>
    </div>
  );
}
