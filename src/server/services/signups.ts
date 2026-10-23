import "server-only";
import { after } from "next/server";
import type { Event } from "@/generated/prisma/client";
import { isLateDrop, sameNyDay, signupWindowState } from "@/lib/event-window";
import { canonicalEmail } from "@/lib/netid";
import { db } from "../db";
import { committeeEmails, sendEmails, type OutgoingEmail } from "../email";
import { committeeAlertEmail, promotedEmail, selectedEmail, spotOpenEmail, waitlistedEmail } from "../email-templates";
import { badRequest, conflict, notFound } from "../http";
import type { CurrentUser } from "../session";
import { totalsFor } from "./points";

/** How many waitlisted people get a "first to claim" email after a late drop. */
const CLAIM_OFFER_COUNT = 3;

function queueEmails(messages: OutgoingEmail[]) {
  if (messages.length) after(() => sendEmails(messages));
}

async function loadEvent(id: string) {
  const event = await db.event.findUnique({
    where: { id },
    include: { term: { select: { lateDropHours: true, noShowPenalty: true } } },
  });
  if (!event) throw notFound("Event not found");
  return event;
}

/** Other same-day events this person is already confirmed for. */
async function sameDayConflicts(event: Event, userIds: string[]) {
  const dayStart = new Date(event.startsAt.getTime() - 24 * 3600_000);
  const dayEnd = new Date(event.startsAt.getTime() + 24 * 3600_000);
  const others = await db.signup.findMany({
    where: {
      userId: { in: userIds },
      status: "SELECTED",
      eventId: { not: event.id },
      event: { canceledAt: null, startsAt: { gte: dayStart, lte: dayEnd } },
    },
    select: { userId: true, event: { select: { title: true, startsAt: true } } },
  });
  const map = new Map<string, string>();
  for (const o of others) if (sameNyDay(o.event.startsAt, event.startsAt)) map.set(o.userId, o.event.title);
  return map;
}

// ---------------------------------------------------------------------------
// Student actions
// ---------------------------------------------------------------------------

export async function signUp(user: CurrentUser, eventId: string, note: string | null | undefined) {
  const event = await loadEvent(eventId);
  if (!event.publishedAt || event.canceledAt) throw notFound("Event not found");
  const window = signupWindowState(event);
  const afterSelection = event.selectionPublishedAt != null;
  if (window === "before") throw badRequest("signups_not_open", "Sign-ups haven't opened yet");
  if (window === "closed" && !afterSelection) throw badRequest("signups_closed", "Sign-ups are closed");
  if (event.startsAt < new Date()) throw badRequest("event_started", "This event has already started");

  const existing = await db.signup.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } });
  if (existing && existing.status !== "DROPPED") throw conflict("already_signed_up", "You're already signed up");
  if (existing?.status === "DROPPED" && existing.wasSelected) {
    throw badRequest("dropped", "You dropped out of this event. Contact the committee to rejoin.");
  }

  // After selection is published, new sign-ups join the end of the waitlist.
  let status: "APPLIED" | "WAITLISTED" = "APPLIED";
  let waitlistPos: number | null = null;
  if (afterSelection) {
    status = "WAITLISTED";
    const last = await db.signup.aggregate({ where: { eventId, status: "WAITLISTED" }, _max: { waitlistPos: true } });
    waitlistPos = (last._max.waitlistPos ?? 0) + 1;
  }

  const data = { netId: user.netId, status, waitlistPos, note: note || null, droppedAt: null, dropReason: null, lateDrop: false };
  const signup = existing
    ? await db.signup.update({ where: { id: existing.id }, data: { ...data, createdAt: new Date() } })
    : await db.signup.create({ data: { ...data, eventId, userId: user.id } });

  if (status === "WAITLISTED") queueEmails([waitlistedEmail(user.email, event, waitlistPos!)]);
  return signup;
}

/**
 * Withdraws from an event. Before selection it simply removes the sign-up.
 * A confirmed person's spot is refilled from the waitlist: automatically if
 * the drop is early, or offered to the top of the waitlist if it's late.
 */
export async function drop(user: CurrentUser, eventId: string, reason: string | null) {
  const event = await loadEvent(eventId);
  const signup = await db.signup.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
    include: { attendance: true },
  });
  if (!signup || signup.status === "DROPPED" || signup.status === "REMOVED") {
    throw notFound("You're not signed up for this event");
  }
  if (signup.attendance) throw badRequest("checked_in", "You've already checked in");
  if (event.endsAt < new Date()) throw badRequest("event_over", "This event is over");

  if (signup.status === "APPLIED") {
    await db.signup.delete({ where: { id: signup.id } });
    return { status: "withdrawn" as const };
  }
  if (signup.status === "WAITLISTED") {
    await db.signup.update({ where: { id: signup.id }, data: { status: "DROPPED", droppedAt: new Date(), dropReason: reason, waitlistPos: null } });
    await renumberWaitlist(eventId);
    return { status: "left_waitlist" as const };
  }

  // SELECTED
  if (!reason) throw badRequest("reason_required", "Tell the committee why you're dropping");
  const late = isLateDrop(event, event.term.lateDropHours);
  await db.signup.update({
    where: { id: signup.id },
    data: { status: "DROPPED", droppedAt: new Date(), dropReason: reason, lateDrop: late },
  });

  const emails: OutgoingEmail[] = [];
  if (!late) {
    const promoted = await promoteNext(event);
    if (promoted) emails.push(promotedEmail(canonicalEmail(promoted.netId), event));
  } else {
    const next = await db.signup.findMany({
      where: { eventId, status: "WAITLISTED" },
      orderBy: { waitlistPos: "asc" },
      take: CLAIM_OFFER_COUNT,
    });
    emails.push(...next.map((s) => spotOpenEmail(canonicalEmail(s.netId), event)));
    for (const to of await committeeEmails()) {
      emails.push(committeeAlertEmail(to, event, "late_drop", `${user.name} (${user.netId})`, `Dropped less than ${event.term.lateDropHours} hours before the start. Reason: "${reason}". Decide whether to excuse it when you finalize the event.`));
    }
  }
  queueEmails(emails);
  return { status: late ? ("late_drop" as const) : ("dropped" as const) };
}

/** A waitlisted person claims an open spot (first come, first served). */
export async function claimSpot(user: CurrentUser, eventId: string) {
  const event = await loadEvent(eventId);
  if (event.canceledAt || event.endsAt < new Date()) throw badRequest("event_over", "This event is over");
  return db.$transaction(async (tx) => {
    const signup = await tx.signup.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } });
    if (!signup || signup.status !== "WAITLISTED") throw badRequest("not_waitlisted", "You're not on the waitlist");
    const selected = await tx.signup.count({ where: { eventId, status: "SELECTED" } });
    if (selected >= event.capacity) throw conflict("no_spot", "Someone already claimed the open spot");
    const conflicts = await sameDayConflicts(event, [user.id]);
    if (conflicts.has(user.id)) {
      throw conflict("double_booked", `You're already confirmed for ${conflicts.get(user.id)} that day`);
    }
    await tx.signup.update({ where: { id: signup.id }, data: { status: "SELECTED", wasSelected: true, waitlistPos: null } });
    return { status: "SELECTED" as const };
  }).then(async (r) => {
    await renumberWaitlist(eventId);
    queueEmails([selectedEmail(user.email, event)]);
    return r;
  });
}

export function openSpots(event: Event, selectedCount: number) {
  return Math.max(0, event.capacity - selectedCount);
}

async function promoteNext(event: Event) {
  const selected = await db.signup.count({ where: { eventId: event.id, status: "SELECTED" } });
  if (selected >= event.capacity) return null;
  const waitlist = await db.signup.findMany({ where: { eventId: event.id, status: "WAITLISTED" }, orderBy: { waitlistPos: "asc" } });
  const conflicts = await sameDayConflicts(event, waitlist.map((w) => w.userId));
  const next = waitlist.find((w) => !conflicts.has(w.userId));
  if (!next) return null;
  await db.signup.update({ where: { id: next.id }, data: { status: "SELECTED", wasSelected: true, waitlistPos: null } });
  await renumberWaitlist(event.id);
  return next;
}

async function renumberWaitlist(eventId: string) {
  const waitlist = await db.signup.findMany({ where: { eventId, status: "WAITLISTED" }, orderBy: [{ waitlistPos: "asc" }, { createdAt: "asc" }] });
  await db.$transaction(waitlist.map((w, i) => db.signup.update({ where: { id: w.id }, data: { waitlistPos: i + 1 } })));
}

// ---------------------------------------------------------------------------
// Committee: selection
// ---------------------------------------------------------------------------

export type RankedSignup = {
  id: string;
  netId: string;
  name: string;
  image: string | null;
  isCandidate: boolean;
  points: number;
  signedUpAt: Date;
  note: string | null;
  status: string;
  waitlistPos: number | null;
  conflict: string | null;
  suggested: "SELECTED" | "WAITLISTED";
};

/**
 * Ranks everyone who signed up: candidates before non-candidates, then
 * fewest points this term, then earliest sign-up. People already confirmed
 * for another event the same day go to the end of the waitlist.
 */
export async function rankSignups(eventId: string): Promise<{ event: Event; ranked: RankedSignup[] }> {
  const event = await loadEvent(eventId);
  const signups = await db.signup.findMany({
    where: { eventId, status: { in: ["APPLIED", "SELECTED", "WAITLISTED"] } },
    include: { user: { select: { name: true, image: true } } },
  });
  const netIds = signups.map((s) => s.netId);
  const [candidates, totals, conflicts] = await Promise.all([
    db.candidate.findMany({ where: { termId: event.termId, netId: { in: netIds } }, select: { netId: true } }),
    totalsFor(event.termId, netIds),
    sameDayConflicts(event, signups.map((s) => s.userId)),
  ]);
  const candidateSet = new Set(candidates.map((c) => c.netId));

  const rows = signups.map((s) => ({
    id: s.id,
    netId: s.netId,
    name: s.user.name,
    image: s.user.image,
    isCandidate: candidateSet.has(s.netId),
    points: totals.get(s.netId) ?? 0,
    signedUpAt: s.createdAt,
    note: s.note,
    status: s.status,
    waitlistPos: s.waitlistPos,
    conflict: conflicts.get(s.userId) ?? null,
  }));
  rows.sort(
    (a, b) =>
      Number(!!a.conflict) - Number(!!b.conflict) ||
      Number(b.isCandidate) - Number(a.isCandidate) ||
      a.points - b.points ||
      a.signedUpAt.getTime() - b.signedUpAt.getTime(),
  );
  let slots = event.capacity;
  const ranked = rows.map((r) => {
    const take = !r.conflict && slots > 0;
    if (take) slots--;
    return { ...r, suggested: take ? ("SELECTED" as const) : ("WAITLISTED" as const) };
  });
  return { event, ranked };
}

/** Publishes the committee's selection and emails everyone their result. */
export async function publishSelection(eventId: string, selected: string[], waitlist: string[]) {
  const event = await loadEvent(eventId);
  if (event.canceledAt) throw badRequest("canceled", "This event is canceled");
  if (selected.length > event.capacity) {
    throw badRequest("over_capacity", `Only ${event.capacity} spots. Raise the capacity or waitlist someone.`);
  }
  const active = await db.signup.findMany({ where: { eventId, status: { in: ["APPLIED", "SELECTED", "WAITLISTED"] } } });
  const byId = new Map(active.map((s) => [s.id, s]));
  const all = [...selected, ...waitlist];
  if (new Set(all).size !== all.length) throw badRequest("duplicate", "Someone is listed twice");
  if (all.length !== active.length || all.some((id) => !byId.has(id))) {
    throw badRequest("stale_selection", "Sign-ups changed while you were editing. Reload and try again.");
  }

  const firstPublish = !event.selectionPublishedAt;
  const emails: OutgoingEmail[] = [];
  await db.$transaction([
    ...selected.map((id) => db.signup.update({ where: { id }, data: { status: "SELECTED", wasSelected: true, waitlistPos: null } })),
    ...waitlist.map((id, i) => db.signup.update({ where: { id }, data: { status: "WAITLISTED", waitlistPos: i + 1 } })),
    db.event.update({ where: { id: eventId }, data: { selectionPublishedAt: event.selectionPublishedAt ?? new Date() } }),
  ]);

  // Email only people whose status changed (everyone, the first time).
  for (const id of selected) {
    const before = byId.get(id)!;
    if (firstPublish || before.status !== "SELECTED") emails.push(selectedEmail(canonicalEmail(before.netId), event));
  }
  waitlist.forEach((id, i) => {
    const before = byId.get(id)!;
    if (firstPublish || before.status !== "WAITLISTED") emails.push(waitlistedEmail(canonicalEmail(before.netId), event, i + 1));
  });
  queueEmails(emails);
  return { selected: selected.length, waitlisted: waitlist.length, emailed: emails.length };
}

// ---------------------------------------------------------------------------
// Committee: manual changes
// ---------------------------------------------------------------------------

/** Adds someone straight to the confirmed list (e.g. a day-of replacement). */
export async function committeeAdd(eventId: string, netId: string) {
  const event = await loadEvent(eventId);
  const user = await db.user.findUnique({ where: { netId } });
  if (!user) throw badRequest("no_account", `${netId} hasn't signed in to the portal yet. Ask them to sign in once with their NYU Google account.`);
  const existing = await db.signup.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } });
  if (existing?.status === "SELECTED") throw conflict("already_selected", `${netId} is already confirmed`);
  const data = { status: "SELECTED" as const, wasSelected: true, waitlistPos: null, droppedAt: null, dropReason: null, lateDrop: false };
  const signup = existing
    ? await db.signup.update({ where: { id: existing.id }, data })
    : await db.signup.create({ data: { ...data, eventId, userId: user.id, netId } });
  await renumberWaitlist(eventId);
  if (event.selectionPublishedAt) queueEmails([selectedEmail(canonicalEmail(netId), event)]);
  return signup;
}

export async function committeeSetStatus(eventId: string, signupId: string, status: "SELECTED" | "WAITLISTED" | "REMOVED") {
  const event = await loadEvent(eventId);
  const signup = await db.signup.findFirst({ where: { id: signupId, eventId }, include: { attendance: true } });
  if (!signup) throw notFound("Sign-up not found");
  if (signup.attendance && status !== "SELECTED") throw badRequest("checked_in", "Undo their check-in first");

  if (status === "SELECTED") {
    const selected = await db.signup.count({ where: { eventId, status: "SELECTED" } });
    if (signup.status !== "SELECTED" && selected >= event.capacity) {
      throw badRequest("full", "The event is full. Raise the capacity or move someone to the waitlist.");
    }
    await db.signup.update({ where: { id: signupId }, data: { status, wasSelected: true, waitlistPos: null } });
    if (event.selectionPublishedAt && signup.status !== "SELECTED") queueEmails([promotedEmail(canonicalEmail(signup.netId), event)]);
  } else if (status === "WAITLISTED") {
    await db.signup.update({ where: { id: signupId }, data: { status, waitlistPos: 0 } });
  } else {
    await db.signup.update({ where: { id: signupId }, data: { status, waitlistPos: null } });
  }
  await renumberWaitlist(eventId);
}

/** Everyone attached to an event, for the committee console. */
export async function eventPeople(eventId: string) {
  const event = await loadEvent(eventId);
  const signups = await db.signup.findMany({
    where: { eventId },
    include: {
      user: { select: { name: true, image: true } },
      attendance: true,
      reviews: { orderBy: { requestedAt: "desc" } },
    },
    orderBy: [{ status: "asc" }, { waitlistPos: "asc" }, { createdAt: "asc" }],
  });
  const candidates = await db.candidate.findMany({
    where: { termId: event.termId, netId: { in: signups.map((s) => s.netId) } },
    select: { netId: true },
  });
  const candidateSet = new Set(candidates.map((c) => c.netId));
  return signups.map((s) => ({
    id: s.id,
    netId: s.netId,
    name: s.user.name,
    image: s.user.image,
    isCandidate: candidateSet.has(s.netId),
    status: s.status,
    waitlistPos: s.waitlistPos,
    note: s.note,
    signedUpAt: s.createdAt,
    droppedAt: s.droppedAt,
    dropReason: s.dropReason,
    lateDrop: s.lateDrop,
    wasSelected: s.wasSelected,
    outcome: s.outcome,
    points: s.points,
    outcomeNote: s.outcomeNote,
    attendance: s.attendance,
    reviews: s.reviews,
  }));
}
