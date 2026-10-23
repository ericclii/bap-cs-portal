import type { ReactNode } from "react";
import { cx } from "./ui";

const STAMP_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });

/** Signed points, with a true minus sign. */
export function signed(points: number) {
  return points > 0 ? `+${points}` : points < 0 ? `−${Math.abs(points)}` : "0";
}

/**
 * A crimson service stamp: a double ring inked over the points and date.
 * Fills its parent, so the parent sets the size.
 */
export function Stamp({ points, date, label, faint, className, children }: { points?: number; date?: Date; label?: string; faint?: boolean; className?: string; children?: ReactNode }) {
  return (
    <span
      className={cx(
        "grid aspect-square w-full place-items-center rounded-full border-2 text-center font-seal leading-none [container-type:inline-size]",
        faint ? "border-dashed border-rule text-secondary" : "border-crimson text-crimson shadow-[inset_0_0_0_3px_var(--surface),inset_0_0_0_4.5px_var(--crimson)]",
        className,
      )}
      aria-hidden
    >
      <span>
        {children}
        {points != null && <span className="block text-[32cqw] font-bold">{signed(points)}</span>}
        {(label || date) && (
          <span className="mt-[4cqw] block text-[12.5cqw] font-bold tracking-[0.06em] uppercase">{label ?? STAMP_DATE.format(date!)}</span>
        )}
      </span>
    </span>
  );
}

export type StampMark =
  | { kind: "stamp"; key: string; points: number; date: Date; title: string }
  | { kind: "struck"; key: string; points: number; date: Date; title: string; reason: string }
  | { kind: "pending"; key: string; date: Date; title: string };

/**
 * The passbook page: one box per scored event, struck for a no-show, dashed
 * for the boxes still to fill before the requirement.
 */
export function StampGrid({ marks, empty, children }: { marks: StampMark[]; empty: number; children?: ReactNode }) {
  const tilt = ["-rotate-[9deg]", "rotate-[5deg]", "-rotate-[3deg]", "rotate-[8deg]", "-rotate-[6deg]"];
  return (
    <ul className="grid grid-cols-4 gap-2" aria-label="Points this term">
      {marks.map((m, i) => (
        <li
          key={m.key}
          title={m.title}
          className={cx(
            "relative grid aspect-square place-items-center rounded-[10px] border border-rule",
            m.kind === "struck" ? "bg-[repeating-linear-gradient(135deg,transparent_0_7px,var(--fill)_7px_8px)]" : "bg-surface",
          )}
        >
          {m.kind === "stamp" && (
            <span className={cx("w-[76%]", tilt[i % tilt.length])}>
              <Stamp points={m.points} date={m.date} />
            </span>
          )}
          {m.kind === "pending" && (
            <span className="w-[76%]">
              <Stamp label="Pending" faint />
            </span>
          )}
          {m.kind === "struck" && (
            <span className="text-center leading-tight">
              <span className="block text-headline font-bold text-secondary tabular-nums">{signed(m.points)}</span>
              <span className="block text-caption font-semibold text-secondary">{m.reason}</span>
            </span>
          )}
          <span className="sr-only">
            {m.title}, {m.kind === "pending" ? "points pending" : `${signed(m.points)} points`}
          </span>
        </li>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <li key={`empty-${i}`} className="aspect-square rounded-[10px] border border-dashed border-rule" aria-hidden />
      ))}
      {children}
    </ul>
  );
}
