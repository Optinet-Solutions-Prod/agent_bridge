import Link from "next/link";
import { Logo } from "@/components/logo";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/[0.08]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-[15px] leading-relaxed text-ink/80">
            The private property network for Portugal. Lisboa, Cascais, Sintra, Comporta, Porto, the Algarve and Madeira, shared between agencies.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-[15px] sm:grid-cols-3">
          <a href="#homes" className="text-ink/80 hover:text-ink">
            Homes
          </a>
          <a href="#agents" className="text-ink/80 hover:text-ink">
            For agents
          </a>
          <Link href="/pricing" className="text-ink/80 hover:text-ink">
            Pricing
          </Link>
          <Link href="/login" className="text-ink/80 hover:text-ink">
            Log in
          </Link>
          <Link href="/signup" className="text-ink/80 hover:text-ink">
            Create an agent profile
          </Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 pb-8 text-[13px] text-ink/70 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <span>
          © {new Date().getFullYear()} {APP_NAME}
        </span>
        <span>Built for licensed real-estate agents in Portugal.</span>
      </div>
    </footer>
  );
}
