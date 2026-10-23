import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Every BAP event happens in New York. */
export const TIMEZONE = "America/New_York";

/** `2026-10-22T18:30` (a datetime-local value, New York time) → UTC Date. */
export function nyLocalToUtc(local: string): Date {
  return fromZonedTime(local, TIMEZONE);
}

/** UTC Date → `2026-10-22T18:30` in New York, for datetime-local inputs. */
export function utcToNyLocal(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

export function formatDate(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "EEE, MMM d");
}

export function formatTime(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "h:mm a");
}

export function formatDateTime(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "EEE, MMM d, h:mm a");
}

/** "Sat, Oct 24 · 9:00 AM – 1:00 PM" (spans days when needed). */
export function formatEventRange(startsAt: Date, endsAt: Date): string {
  const sameDay =
    formatInTimeZone(startsAt, TIMEZONE, "yyyy-MM-dd") === formatInTimeZone(endsAt, TIMEZONE, "yyyy-MM-dd");
  const underADay = endsAt.getTime() - startsAt.getTime() < 24 * 3600_000;
  if (sameDay || underADay) return `${formatDate(startsAt)} · ${formatTime(startsAt)} – ${formatTime(endsAt)}`;
  return `${formatDateTime(startsAt)} – ${formatDateTime(endsAt)}`;
}

/** "in 3 days", "tomorrow", "today" relative to now, for sign-up deadlines. */
export function relativeDay(date: Date, now = new Date()): string {
  const day = (d: Date) => formatInTimeZone(d, TIMEZONE, "yyyy-MM-dd");
  const diff = Math.round((Date.parse(day(date)) - Date.parse(day(now))) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}
