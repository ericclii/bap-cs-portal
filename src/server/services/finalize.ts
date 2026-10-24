import "server-only";
import { after } from "next/server";
import type { Outcome } from "@/generated/prisma/client";
import { formatDue, nextCheckpoint } from "@/lib/checkpoints";
import { attendedMinutes, checkoutUnlocksAt } from "@/lib/event-window";
import { canonicalEmail } from "@/lib/netid";
import { db } from "../db";
import { sendEmails, type OutgoingEmail } from "../email";
import { pointsRecordedEmail } from "../email-templates";
import { badRequest, notFound } from "../http";
import { listCheckpoints } from "./checkpoints";
import { totalPoints } from "./points";

export type FinalizeRow = {
  signupId: string;
  netId: string;
  name: string;
  image: string | null;
  status: string;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  minutes: number | null;
  flags: string[];
  suggested: { outcome: Outcome; points: number };
  current: { outcome: Outcome; points: number; note: string | null } | null;
  dropReason: string | null;
};

/**
 * Everyone who was confirmed for the event, with a suggested outcome and the
 * things a human should look at. This replaces cross-checking the sign-up
 * sheet against the attendance form by hand.
 */
export async function finalizePreview(eventId: string) {
  const event = await db.event.findUnique({ where: { id: eventId }, include: { term: true } });
  if (!event) throw notFound("Event not found");
  const penalty = event.term.noShowPenalty;
  const signups = await db.signup.findMany({
    where: { eventId, wasSelected: true, status: { in: ["SELECTED", "DROPPED"] } },
    include: { user: { select: { name: true, image: true } }, attendance: true, reviews: true },
    orderBy: { netId: "asc" },
  });

  const rows: FinalizeRow[] = [];
  for (const s of signups) {
    const a = s.attendance;
    const openReviews = s.reviews.filter((r) => r.status === "OPEN");
    const early = s.reviews.find((r) => r.kind === "EARLY_CHECKOUT");
    const flags: string[] = [];
    let suggested: { outcome: Outcome; points: number };

    if (s.status === "DROPPED") {
      if (!s.lateDrop) continue; // dropped in time: no points either way
      flags.push(`Late drop (under ${event.term.lateDropHours} hours)`);
      suggested = { outcome: "NO_SHOW", points: penalty };
    } else if (!a) {
      suggested = { outcome: "NO_SHOW", points: penalty };
      if (openReviews.some((r) => r.kind === "CHECKIN_LOCATION")) flags.push("Asked for a location review");
    } else {
      suggested = { outcome: "ATTENDED", points: event.points };
      if (!a.checkedOutAt) flags.push("Never checked out");
      if (a.leftAreaAt && (!a.checkedOutAt || a.leftAreaAt < a.checkedOutAt)) flags.push("Phone left the area before checking out");
      if (a.earlyCheckout) {
        const unlock = checkoutUnlocksAt(event, a.checkedInAt);
        const short = Math.round((unlock.getTime() - a.checkedOutAt!.getTime()) / 60_000);
        if (early?.status === "DENIED") {
          flags.push(`Early check-out denied (${short} min short)`);
          suggested = { outcome: "ATTENDED", points: 0 };
        } else if (early?.status === "APPROVED") {
          flags.push(`Early check-out approved (${short} min short)`);
        } else {
          flags.push(`Left ${short} min early: "${a.earlyReason ?? ""}"`);
        }
      }
      if (a.checkInMethod === "COMMITTEE") flags.push("Checked in by committee");
    }
    if (openReviews.length) flags.push(`${openReviews.length} unresolved review${openReviews.length > 1 ? "s" : ""}`);

    rows.push({
      signupId: s.id,
      netId: s.netId,
      name: s.user.name,
      image: s.user.image,
      status: s.status,
      checkedInAt: a?.checkedInAt ?? null,
      checkedOutAt: a?.checkedOutAt ?? null,
      minutes: a ? attendedMinutes(a.checkedInAt, a.checkedOutAt) : null,
      flags,
      suggested,
      current: s.outcome ? { outcome: s.outcome, points: s.points ?? 0, note: s.outcomeNote } : null,
      dropReason: s.dropReason,
    });
  }
  return { event, rows, noShowPenalty: penalty };
}

/** Saves outcomes, locks the event and emails each person their result. */
export async function finalizeEvent(
  eventId: string,
  outcomes: { signupId: string; outcome: Outcome; points: number; note?: string | null }[],
) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) throw notFound("Event not found");
  if (event.endsAt > new Date()) throw badRequest("not_over", "You can finalize once the event has ended");

  const signups = await db.signup.findMany({ where: { eventId, id: { in: outcomes.map((o) => o.signupId) } } });
  if (signups.length !== outcomes.length) throw badRequest("stale", "The attendance list changed. Reload and try again.");
  const before = new Map(signups.map((s) => [s.id, s]));

  await db.$transaction([
    ...outcomes.map((o) =>
      db.signup.update({ where: { id: o.signupId }, data: { outcome: o.outcome, points: o.points, outcomeNote: o.note || null } }),
    ),
    db.event.update({ where: { id: eventId }, data: { finalizedAt: event.finalizedAt ?? new Date() } }),
  ]);

  // Email people whose result is new or changed.
  const term = await db.term.findUniqueOrThrow({ where: { id: event.termId } });
  const changed = outcomes.filter((o) => {
    const prev = before.get(o.signupId)!;
    return prev.outcome !== o.outcome || prev.points !== o.points;
  });
  const checkpoints = await listCheckpoints(term.id);
  const emails: OutgoingEmail[] = [];
  for (const o of changed) {
    const netId = before.get(o.signupId)!.netId;
    const total = await totalPoints(term.id, netId);
    // Point them at the next checkpoint they haven't reached yet, if any.
    const next = nextCheckpoint(checkpoints.filter((c) => total < c.points));
    emails.push(pointsRecordedEmail(canonicalEmail(netId), event, o.outcome, o.points, total, next && { name: next.name, points: next.points, due: formatDue(next) }));
  }
  if (emails.length) after(() => sendEmails(emails));
  return { saved: outcomes.length, emailed: emails.length };
}
