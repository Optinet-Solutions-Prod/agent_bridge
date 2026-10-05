import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className, light }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-md bg-teal-700 text-sm font-bold text-white">A</span>
      <span className={light ? "text-white" : "text-slate-900"}>{APP_NAME}</span>
    </Link>
  );
}
