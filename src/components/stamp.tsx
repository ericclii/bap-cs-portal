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

/** The four standings a candidate stamps through on the way to the requirement. */
export const MILESTONES = [
  { name: "Checkpoint Alpha", short: "Alpha", points: 3 },
  { name: "Checkpoint Bravo", short: "Bravo", points: 6 },
  { name: "Gold Standing", short: "Gold", points: 10 },
  { name: "Platinum Standing", short: "Platinum", points: 12 },
] as const;

/**
 * The passbook page: one box per milestone. A reached milestone is stamped;
 * the rest stay dashed, showing the points they need.
 */
export function MilestoneGrid({ points, reachedOn }: { points: number; reachedOn: (Date | null)[] }) {
  const tilt = ["-rotate-[9deg]", "rotate-[5deg]", "-rotate-[3deg]", "rotate-[8deg]"];
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Milestones">
      {MILESTONES.map((m, i) => {
        const reached = points >= m.points;
        const on = reachedOn[i];
        return (
          <li key={m.name} className="min-w-0 text-center">
            <div
              className={cx(
                "grid aspect-square place-items-center rounded-[10px] border border-rule",
                reached ? "bg-surface" : "border-dashed",
              )}
              title={reached && on ? `${m.name}, reached ${STAMP_DATE.format(on)}` : m.name}
            >
              {reached ? (
                <span className={cx("w-[80%]", tilt[i])}>
                  <Stamp>
                    <span className="block text-[34cqw] font-bold">{m.points}</span>
                    <span className="mt-[3cqw] block text-[11.5cqw] font-bold tracking-[0.04em] uppercase">{m.short}</span>
                  </Stamp>
                </span>
              ) : (
                <span className="text-headline font-semibold text-secondary tabular-nums">{m.points}</span>
              )}
            </div>
            <p className={cx("mt-1.5 text-caption leading-tight font-semibold text-balance", reached ? "text-text" : "text-secondary")}>
              {m.name}
            </p>
            <span className="sr-only">{reached ? ", reached" : `, ${m.points - points} points to go`}</span>
          </li>
        );
      })}
    </ol>
  );
}
