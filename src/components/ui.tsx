import Link from "next/link";
import type { ComponentProps, ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Button */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary: "bg-teal-700 text-white shadow-sm shadow-teal-900/10 hover:bg-teal-800 focus-visible:ring-teal-600",
  secondary: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400",
  ghost: "text-slate-700 hover:bg-slate-900/5 focus-visible:ring-slate-400",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500",
  dark: "bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-700",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonStyles({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonStyles({ variant, size, className })} {...props} />;
}

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}

/* ------------------------------------------------------------------- Forms */

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p data-field-error className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div data-form-error role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {message}
    </div>
  );
}

/* ------------------------------------------------------------------ Layout */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.03)]", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-base font-semibold tracking-tight text-slate-900", className)} {...props} />;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 lg:text-[28px]">{title}</h1>
        {description && <div className="mt-1.5 text-sm text-slate-600">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
      {Icon && (
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-2xl bg-slate-200/70", className)} {...props} />;
}

/* ------------------------------------------------------------------- Badge */

type Tone = "neutral" | "teal" | "amber" | "green" | "red" | "blue";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  teal: "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-600/20",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  green: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  blue: "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-600/20",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", toneStyles[tone], className)}
      {...props}
    />
  );
}

/** Small pill for features and specs. */
export function Chip({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700", className)}
      {...props}
    />
  );
}

/** Anonymous agent handle, e.g. "Agent #MT18472". */
export function AnonBadge({
  code,
  verified,
  prefix = "Agent",
  light,
}: {
  code: string;
  verified?: boolean;
  prefix?: string;
  light?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-medium",
        light ? "bg-white/15 text-white ring-1 ring-inset ring-white/20 backdrop-blur" : "bg-slate-900 text-white",
      )}
    >
      {prefix} #{code}
      {verified && (
        <span title="Verified agent" className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" aria-label="Verified" />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------- Stats */

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: "neutral" | "teal" | "amber";
}) {
  const iconTone = { neutral: "bg-slate-100 text-slate-600", teal: "bg-teal-50 text-teal-700", amber: "bg-amber-50 text-amber-700" }[tone];
  return (
    <Card className="flex items-start gap-4 p-5">
      {Icon && (
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", iconTone)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </Card>
  );
}

export function DescriptionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4 py-2.5 text-sm">
          <dt className="text-slate-500">{item.label}</dt>
          <dd className="text-right font-medium text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
