import Link from "next/link";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui";
import { DEMO_MODE } from "@/lib/demo";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const linkClass = "rounded-lg px-3 py-2 text-[15px] text-ink/80 transition hover:text-ink";
  return (
    <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-limestone/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
          <a href="#homes" className={`hidden sm:inline ${linkClass}`}>
            Homes
          </a>
          <a href="#agents" className={`hidden sm:inline ${linkClass}`}>
            For agents
          </a>
          <Link href="/pricing" className={`hidden md:inline ${linkClass}`}>
            Pricing
          </Link>
          {signedIn ? (
            <LinkButton href="/dashboard" size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
              Open dashboard
            </LinkButton>
          ) : (
            <>
              <Link href="/login" className={`hidden sm:inline ${linkClass}`}>
                Log in
              </Link>
              <LinkButton href={DEMO_MODE ? "/dashboard" : "/signup"} size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
                {DEMO_MODE ? "Open the app" : "Join the network"}
              </LinkButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
