import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatEventRange } from "@/lib/time";
import { DateTile, cx } from "./ui";

/**
 * The event as a Wallet-style pass: the one thing a student needs on the
 * day. Used on the home screen and atop the event page.
 */
export function EventPass({
  event,
  status,
  action,
  href,
  children,
}: {
  event: { title: string; partnerOrg: string | null; locationName: string | null; address?: string | null; startsAt: Date; endsAt: Date };
  status?: ReactNode;
  action?: ReactNode;
  href?: string;
  children?: ReactNode;
}) {
  const header = (
    <div className="flex items-start gap-3.5">
      <DateTile date={event.startsAt} size="lg" />
      <div className="min-w-0 flex-1 pt-0.5">
        <h2 className="text-title font-bold text-balance">{event.title}</h2>
        {event.partnerOrg && <p className="mt-0.5 text-body text-secondary">{event.partnerOrg}</p>}
      </div>
    </div>
  );
  return (
    <article className="rounded-[22px] bg-surface p-4 shadow-pass sm:p-5">
      {href ? (
        <Link href={href} className="-m-1 block rounded-2xl p-1 transition-opacity duration-150 hover:opacity-80">
          {header}
        </Link>
      ) : (
        header
      )}
      <dl className="mt-4 space-y-2 text-body">
        <div className="flex items-center gap-2.5">
          <dt className="sr-only">When</dt>
          <Clock className="h-4 w-4 shrink-0 text-tertiary" aria-hidden />
          <dd>{formatEventRange(event.startsAt, event.endsAt)}</dd>
        </div>
        {(event.locationName || event.address) && (
          <div className="flex items-center gap-2.5">
            <dt className="sr-only">Where</dt>
            <MapPin className="h-4 w-4 shrink-0 text-tertiary" aria-hidden />
            <dd className="min-w-0 truncate">{event.locationName ?? event.address}</dd>
          </div>
        )}
      </dl>
      {status && <div className={cx("mt-4 border-t border-dashed border-separator pt-4")}>{status}</div>}
      {children}
      {action && <div className="mt-4">{action}</div>}
    </article>
  );
}
