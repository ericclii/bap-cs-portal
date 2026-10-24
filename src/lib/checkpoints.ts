import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TIMEZONE } from "./time";

/** A points threshold, due by a date (end of that day in New York) or by the end of the semester. */
export type Checkpoint = { id: string; name: string; points: number; dueAt: Date | null };

export type CheckpointStatus = "passed" | "missed" | "open";

/** Dated checkpoints first, by date; then end-of-semester ones, by points. */
export function sortCheckpoints<T extends Checkpoint>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (a.dueAt && b.dueAt) return a.dueAt.getTime() - b.dueAt.getTime() || a.points - b.points;
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return a.points - b.points;
  });
}

export function checkpointStatus(total: number, c: Checkpoint, now = new Date()): CheckpointStatus {
  if (total >= c.points) return "passed";
  return c.dueAt && c.dueAt < now ? "missed" : "open";
}

/** The first checkpoint still ahead: dated ones until they pass, then the end of the semester. */
export function nextCheckpoint<T extends Checkpoint>(list: T[], now = new Date()): T | null {
  return sortCheckpoints(list).find((c) => !c.dueAt || c.dueAt >= now) ?? null;
}

/** `2026-10-24` → the last moment of that day in New York. */
export function dueDateToUtc(day: string): Date {
  return fromZonedTime(`${day}T23:59:59.999`, TIMEZONE);
}

/** For date inputs: the New York day a checkpoint falls due. */
export function utcToDueDate(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
}

/** "Oct 24" or "End of semester". */
export function formatDue(c: { dueAt: Date | null }): string {
  return c.dueAt ? formatInTimeZone(c.dueAt, TIMEZONE, "MMM d") : "End of semester";
}
