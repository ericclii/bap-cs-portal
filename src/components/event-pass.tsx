import Link from "next/link";
import type { ReactNode } from "react";
import { checkoutUnlocksAt } from "@/lib/event-window";
import { formatEventRange, formatTime } from "@/lib/time";
import { DateTile, cx } from "./ui";

type PassEvent = {
  title: string;
  partnerOrg: string | null;
  locationName: string | null;
  address?: string | null;
  startsAt: Date;
  endsAt: Date;
  minMinutes?: number;
};

/**
 * The event as a passbook entry: the one thing a student needs on the day.
 * Used on the home screen and atop the event page. `accent` marks the next
 * event, the only date drawn in crimson.
 */
export function EventPass({
  event,
  status,
  action,
  href,
  accent,
  checkedInAt,
  titleAs: Title = "h2",
  children,
}: {
  event: PassEvent;
  status?: ReactNode;
  action?: ReactNode;
  href?: string;
  accent?: boolean;
  checkedInAt?: Date | null;
  titleAs?: "h1" | "h2" | "h3";
  children?: ReactNode;
}) {
  const place = event.locationName ?? event.address;
  const header = (
    <div className="flex items-start gap-3.5">
      <DateTile date={event.startsAt} size="lg" accent={accent} />
      <div className="min-w-0 flex-1">
        <Title className="text-title font-bold text-balance break-words">{event.title}</Title>
        <p className="mt-1 text-body text-secondary">
          {formatEventRange(event.startsAt, event.endsAt)}
          {place && <span className="block truncate">{[place, event.partnerOrg].filter(Boolean).join(" · ")}</span>}
        </p>
      </div>
    </div>
  );
  return (
    <article className="rounded-2xl bg-surface p-4 ring-1 ring-rule sm:p-5">
      {href ? (
        <Link href={href} className="-m-1 block rounded-xl p-1 transition-opacity duration-150 hover:opacity-80">
          {header}
        </Link>
      ) : (
        header
      )}
      {event.minMinutes != null && <TimeOnSite startsAt={event.startsAt} endsAt={event.endsAt} minMinutes={event.minMinutes} checkedInAt={checkedInAt} />}
      {status && <div className={cx("mt-4")}>{status}</div>}
      {children}
      {action && <div className="mt-4">{action}</div>}
    </article>
  );
}

/**
 * Time on site drawn to scale: the event's span, with the stretch you must
 * stay before a normal check-out filled in and its end marked.
 */
export function TimeOnSite({ startsAt, endsAt, minMinutes, checkedInAt }: { startsAt: Date; endsAt: Date; minMinutes: number; checkedInAt?: Date | null }) {
  const span = endsAt.getTime() - startsAt.getTime();
  if (span <= 0) return null;
  // Same rule as check-out itself: the minimum counts from check-in (or the start, before then).
  const from = checkedInAt ?? startsAt;
  const until = checkoutUnlocksAt({ endsAt, minMinutes }, from);
  const pos = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - startsAt.getTime()) / span) * 100));
  const left = pos(from);
  const mark = pos(until);
  return (
    <div className="mt-4" aria-label={`Check out from ${formatTime(until)}`} role="img">
      <div className="relative mb-1.5 h-4 text-footnote font-semibold whitespace-nowrap tabular-nums" aria-hidden>
        <span className={cx("absolute", mark > 50 && "-translate-x-full")} style={{ left: `${mark}%` }}>
          Check out from {formatTime(until)}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-fill">
        <div className="absolute inset-y-0 rounded-full bg-rule" style={{ left: `${left}%`, width: `${mark - left}%` }} />
        <div className="absolute -top-1 h-3.5 w-px bg-text" style={{ left: `${mark}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-footnote text-secondary tabular-nums" aria-hidden>
        <span>{formatTime(startsAt)}</span>
        <span>{formatTime(endsAt)}</span>
      </div>
    </div>
  );
}
