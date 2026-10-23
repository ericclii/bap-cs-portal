// Pure rules about when sign-up, check-in and check-out are allowed. Shared
// by the server (enforcement) and clients (to show the right button and copy).

const MIN = 60_000;

export type EventTiming = {
  startsAt: Date;
  endsAt: Date;
  checkinOpensMinBefore: number;
  checkinClosesMinAfter: number;
};

/** After the event ends, attendees can still check out for this long. */
export const CHECKOUT_GRACE_MINUTES = 3 * 60;
/** Default for drops counted as "late" (each term can override it). */
export const LATE_DROP_HOURS = 24;

export function checkinOpensAt(e: EventTiming): Date {
  return new Date(e.startsAt.getTime() - e.checkinOpensMinBefore * MIN);
}

/** Latest check-in: some minutes after the start (late arrivals), never after the end. */
export function checkinClosesAt(e: EventTiming): Date {
  return new Date(Math.min(e.startsAt.getTime() + e.checkinClosesMinAfter * MIN, e.endsAt.getTime()));
}

export type CheckinWindowState = "before" | "open" | "closed";

export function checkinWindowState(e: EventTiming, now = new Date()): CheckinWindowState {
  if (now < checkinOpensAt(e)) return "before";
  if (now > checkinClosesAt(e)) return "closed";
  return "open";
}

/**
 * When a normal (non-early) check-out unlocks: after the minimum time on
 * site, but never later than the event's end.
 */
export function checkoutUnlocksAt(
  e: { endsAt: Date; minMinutes: number },
  checkedInAt: Date,
): Date {
  return new Date(Math.min(checkedInAt.getTime() + e.minMinutes * MIN, e.endsAt.getTime()));
}

export function checkoutDeadline(e: { endsAt: Date }): Date {
  return new Date(e.endsAt.getTime() + CHECKOUT_GRACE_MINUTES * MIN);
}

export function isLateDrop(e: { startsAt: Date }, hours = LATE_DROP_HOURS, now = new Date()): boolean {
  return e.startsAt.getTime() - now.getTime() < hours * 3600_000;
}

export type SignupWindowState = "before" | "open" | "closed";

export function signupWindowState(
  e: { signupOpensAt: Date; signupClosesAt: Date },
  now = new Date(),
): SignupWindowState {
  if (now < e.signupOpensAt) return "before";
  if (now > e.signupClosesAt) return "closed";
  return "open";
}

/** Minutes between check-in and check-out, or null if not checked out. */
export function attendedMinutes(checkedInAt: Date, checkedOutAt: Date | null): number | null {
  if (!checkedOutAt) return null;
  return Math.max(0, Math.round((checkedOutAt.getTime() - checkedInAt.getTime()) / MIN));
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Same calendar day in New York. Used for double-booking checks. */
export function sameNyDay(a: Date, b: Date): boolean {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return day(a) === day(b);
}
