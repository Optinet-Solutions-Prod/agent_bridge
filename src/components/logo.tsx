import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Brand mark: two agents' halves meeting over a bridge line. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-teal-500 to-teal-800 text-white shadow-sm shadow-teal-900/20",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17V9l4-3 4 3v8" />
        <path d="M13 17V9l4-3 4 3v8" />
        <path d="M3 17h18" />
        <path d="M9 13h6" strokeDasharray="1.5 2.5" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className, light }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className={light ? "text-white" : "text-slate-900"}>{APP_NAME}</span>
    </Link>
  );
}
