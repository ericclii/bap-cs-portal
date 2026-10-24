import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Buttons: one filled crimson primary per view; everything else is text
// that draws an underline on hover.
// ---------------------------------------------------------------------------

type Variant = "primary" | "secondary" | "plain" | "destructive";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "rounded-full bg-crimson text-on-crimson hover:bg-crimson-hover active:scale-[0.98]",
  secondary: "btn-text u-line text-text",
  plain: "btn-text u-line text-crimson",
  destructive: "btn-text u-line text-crimson",
};
// Text buttons have no horizontal padding, so the underline spans the label exactly.
const sizeClass: Record<Size, [filled: string, text: string]> = {
  sm: ["h-8 px-3.5 text-footnote", "h-8 text-footnote"],
  md: ["h-10 px-4 text-body", "h-10 text-body"],
  lg: ["h-[50px] px-6 text-headline", "h-[50px] text-headline"],
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(
    "hit inline-flex shrink-0 select-none items-center justify-center gap-2 font-semibold whitespace-nowrap",
    "transition-[background-color,color,transform,opacity] duration-200",
    "disabled:pointer-events-none disabled:opacity-40",
    variantClass[variant],
    sizeClass[size][variant === "primary" ? 0 : 1],
    extra,
  );
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({ variant, size, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Grouped lists (iOS inset grouped style).
// ---------------------------------------------------------------------------

/** A white region on the grey ground; its rows are set apart by faint inset hairlines. */
export function Group({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cx("overflow-hidden rounded-2xl bg-surface [&>*+*]:border-t [&>*+*]:border-separator", className)} {...props}>
      {children}
    </div>
  );
}

/** Small header above a group, with an optional trailing action. */
export function GroupHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-h-7 items-end justify-between gap-3 pb-2.5">
      <h2 className="text-title">{children}</h2>
      {action}
    </div>
  );
}

export function GroupFooter({ children }: { children: ReactNode }) {
  return <p className="pt-2 text-footnote leading-snug text-secondary">{children}</p>;
}

export function Section({ title, action, footer, children, className }: { title?: ReactNode; action?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      {title && <GroupHeader action={action}>{title}</GroupHeader>}
      {children}
      {footer && <GroupFooter>{footer}</GroupFooter>}
    </section>
  );
}

/** One row inside a Group. Becomes a link when `href` is set. */
export function Row({
  href,
  leading,
  title,
  subtitle,
  trailing,
  chevron,
  stackTrailing,
  className,
}: {
  href?: string;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  /** On phones, show `trailing` under the subtitle instead of taking width. */
  stackTrailing?: boolean;
  className?: string;
}) {
  const body = (
    <>
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="text-body font-medium leading-snug">{title}</div>
        {subtitle && <div className="mt-0.5 text-footnote leading-snug text-secondary">{subtitle}</div>}
        {trailing && stackTrailing && <div className="mt-1.5 flex items-center gap-2 sm:hidden">{trailing}</div>}
      </div>
      {trailing && <div className={cx("shrink-0 items-center gap-2", stackTrailing ? "hidden sm:flex" : "flex")}>{trailing}</div>}
      {chevron && <ChevronRight className="h-4 w-4 shrink-0 text-tertiary" />}
    </>
  );
  const base = "flex min-h-14 items-center gap-3 px-4 py-3";
  if (href) {
    return (
      <Link href={href} className={cx(base, "transition-colors duration-200 hover:bg-ground active:bg-fill", className)}>
        {body}
      </Link>
    );
  }
  return <div className={cx(base, className)}>{body}</div>;
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type Tone = "neutral" | "crimson" | "green" | "amber" | "blue" | "sand";
const toneText: Record<Tone, string> = {
  neutral: "text-secondary",
  crimson: "text-crimson",
  green: "text-green",
  amber: "text-amber",
  blue: "text-blue",
  sand: "text-gold",
};

/** A status label: tinted words on a grey lozenge. */
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx("inline-flex h-6 items-center rounded-full bg-fill px-2.5 text-caption font-semibold whitespace-nowrap", toneText[tone])}>
      {children}
    </span>
  );
}

export function Notice({ tone = "blue", children, action }: { tone?: Exclude<Tone, "neutral" | "sand">; children: ReactNode; action?: ReactNode }) {
  return (
    <div
      role={tone === "crimson" ? "alert" : "status"}
      className={cx(
        "reveal flex flex-col gap-2 rounded-2xl px-4 py-3 text-body leading-snug sm:flex-row sm:items-center sm:justify-between",
        tone === "crimson" ? "bg-crimson-soft text-crimson" : "bg-surface",
        tone === "amber" ? "text-amber" : tone !== "crimson" && "text-text",
      )}
    >
      <div>{children}</div>
      {action}
    </div>
  );
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-1.5 overflow-hidden rounded-full bg-fill">
      <div className={cx("h-full rounded-full transition-[width] duration-500 ease-out", value >= max ? "bg-gold-bright" : "bg-text/70")} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Identity and dates
// ---------------------------------------------------------------------------

export function Avatar({ name, image, size = 32 }: { name?: string | null; image?: string | null; size?: number }) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (image) {
    // Google profile photos; a plain img avoids remote image config.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" width={size} height={size} referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full bg-fill font-semibold text-secondary" style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {initials}
    </span>
  );
}

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "America/New_York" });
const DAY = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "America/New_York" });
const YMD = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" });

/**
 * Calendar-style date tile. Today's tile is marked in crimson type (never a
 * crimson block, which would compete with the primary action). Pass
 * `today={false}` where something else already says it, like a Live pill.
 */
export function DateTile({ date, size = "md", muted, today: todayProp, accent }: { date: Date; size?: "sm" | "md" | "lg"; muted?: boolean; today?: boolean; accent?: boolean }) {
  const dims = { sm: "h-10 w-10", md: "h-12 w-12", lg: "h-16 w-16" }[size];
  const day = { sm: "text-[17px]", md: "text-[20px]", lg: "text-[28px]" }[size];
  // The next event and today's date are the only dates drawn in crimson.
  const today = !muted && (accent || (todayProp ?? YMD.format(date) === YMD.format(new Date())));
  return (
    <div
      className={cx("font-display flex shrink-0 flex-col items-center justify-center rounded-xl leading-none", today ? "bg-crimson-soft" : "bg-fill", dims)}
      aria-hidden
    >
      <span className={cx("text-[10px] font-bold uppercase tracking-wide", today ? "text-crimson" : "text-secondary")}>{MONTH.format(date)}</span>
      <span className={cx("mt-0.5 font-semibold tabular-nums", day, today && "text-crimson", muted && "text-secondary")}>{DAY.format(date)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

/** Filled input without a width, for controls that set their own. */
export const inputBase =
  "block rounded-xl bg-fill px-3.5 py-2.5 text-body text-text placeholder:text-placeholder outline-none transition-[background-color,box-shadow] duration-200 focus:bg-surface focus:ring-2 focus:ring-crimson/60 disabled:opacity-50";

export const inputClass = `${inputBase} w-full`;

/** Themed select: drawn chevron, height-led sizing (no padding conflicts). */
export function Select({ className, size = "md", ...props }: Omit<ComponentProps<"select">, "size"> & { size?: "sm" | "md" }) {
  return (
    <span className={cx("relative inline-flex", className)}>
      <select
        {...props}
        className={cx(
          "w-full appearance-none rounded-xl bg-fill pr-9 pl-3.5 text-text outline-none transition-[background-color,box-shadow] duration-200 focus:bg-surface focus:ring-2 focus:ring-crimson/60 disabled:opacity-50",
          size === "sm" ? "h-8 text-footnote pointer-coarse:h-10" : "h-10 text-body pointer-coarse:h-11",
        )}
      />
      <svg viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 6l4 4 4-4" />
      </svg>
    </span>
  );
}

export function Field({ label, hint, error, htmlFor, children }: { label: string; hint?: ReactNode; error?: string | null; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-footnote font-medium text-secondary">
        {label}
      </label>
      {children}
      {error ? <p className="text-footnote text-crimson">{error}</p> : hint ? <p className="text-footnote leading-snug text-secondary">{hint}</p> : null}
    </div>
  );
}

/** iOS-style switch row. */
export function Toggle({ checked, onChange, label, description, id }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description?: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-body font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-footnote leading-snug text-secondary">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-[31px] w-[51px] rounded-full bg-fill-strong transition-colors duration-200 peer-checked:bg-crimson peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-crimson" />
        <span className="absolute top-0.5 left-0.5 h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgb(0_0_0/0.18)] transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Segmented control for switching views (tabs). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-[10px] bg-fill p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cx(
            "h-8 rounded-lg px-3.5 text-footnote font-semibold whitespace-nowrap pointer-coarse:h-10 transition-[background-color,color,box-shadow] duration-150 disabled:opacity-35",
            value === o.value ? "bg-surface text-text shadow-[0_1px_3px_rgb(46_46_46/0.12)]" : "text-secondary hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page structure
// ---------------------------------------------------------------------------

/** Large title, iOS style, with optional trailing actions. */
export function PageTitle({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-display font-bold text-balance break-words">{title}</h1>
        {subtitle && <div className="mt-1 text-body text-secondary">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-surface px-6 py-10 text-center">
      {icon && <div className="mb-3 text-tertiary">{icon}</div>}
      <p className="text-body font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-body leading-snug text-secondary">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="u-line inline-flex items-center gap-0.5 py-0.5 text-body text-crimson">
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M10 3.5 5.5 8l4.5 4.5" />
      </svg>
      {children}
    </Link>
  );
}

/** A plain white panel for forms and composite content. */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl bg-surface p-4 sm:p-5", className)} {...props} />;
}
