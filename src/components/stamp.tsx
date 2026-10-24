import type { ReactNode } from "react";
import { type Checkpoint, checkpointStatus, formatDue } from "@/lib/checkpoints";
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
        faint ? "border-transparent bg-fill text-secondary" : "border-crimson text-crimson shadow-[inset_0_0_0_3px_var(--surface),inset_0_0_0_4.5px_var(--crimson)]",
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

/**
 * The passbook page: one box per checkpoint. A reached checkpoint is stamped
 * with its points and the day it was reached; one still ahead shows the points
 * it needs; one that passed unreached says so.
 */
export function MilestoneGrid({ points, checkpoints, reachedOn }: { points: number; checkpoints: Checkpoint[]; reachedOn: (Date | null)[] }) {
  const tilt = ["-rotate-[9deg]", "rotate-[5deg]", "-rotate-[3deg]", "rotate-[8deg]", "-rotate-[6deg]"];
  const now = new Date();
  return (
    // Up to five checkpoints share one row (more wrap in fours); the narrowest phones fit what they can.
    <ol
      className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-x-2 gap-y-4 min-[360px]:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
      style={{ "--cols": checkpoints.length <= 5 ? checkpoints.length : 4 } as React.CSSProperties}
      aria-label="Checkpoints"
    >
      {checkpoints.map((c, i) => {
        const status = checkpointStatus(points, c, now);
        const on = reachedOn[i];
        return (
          <li key={c.id} className="min-w-0 text-center">
            <div
              className={cx("grid aspect-square place-items-center rounded-[10px] transition-colors duration-300", status === "passed" ? "bg-surface" : "bg-fill")}
              title={status === "passed" && on ? `${c.name}, reached ${STAMP_DATE.format(on)}` : c.name}
            >
              {status === "passed" ? (
                <span className={cx("w-[80%]", tilt[i % tilt.length])}>
                  <Stamp>
                    <span className="block text-[34cqw] font-bold">{c.points}</span>
                    {on && <span className="mt-[3cqw] block text-[12cqw] font-bold tracking-[0.04em] uppercase">{STAMP_DATE.format(on)}</span>}
                  </Stamp>
                </span>
              ) : (
                <span className={cx("text-headline font-semibold tabular-nums", status === "missed" ? "text-amber" : "text-secondary")}>{c.points}</span>
              )}
            </div>
            <p className={cx("mt-1.5 text-caption leading-tight font-semibold text-balance", status === "passed" ? "text-text" : "text-secondary")}>{c.name}</p>
            <p className={cx("mt-0.5 text-caption leading-tight", status === "missed" ? "text-amber" : "text-secondary")}>
              {status === "missed" ? "Missed" : c.dueAt ? `By ${formatDue(c)}` : formatDue(c)}
            </p>
            <span className="sr-only">{status === "passed" ? ", reached" : `, ${c.points - points} points to go`}</span>
          </li>
        );
      })}
    </ol>
  );
}
