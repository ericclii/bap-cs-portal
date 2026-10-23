import "server-only";
import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { canonicalEmail } from "@/lib/netid";
import type { Event } from "@/generated/prisma/client";
import type { EventInput } from "@/lib/contracts";
import { checkinWindowState, signupWindowState } from "@/lib/event-window";
import { nyLocalToUtc } from "@/lib/time";
import { db } from "../db";
import { sendEmails } from "../email";
import { canceledEmail, restoredEmail } from "../email-templates";
import { badRequest, notFound } from "../http";
import { newQrSecret, verifyVenuePass } from "../venue-qr";
import { requireCurrentTerm } from "./terms";

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function newSlug(length = 8) {
  return Array.from(randomBytes(length), (b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join("");
}

/** Event as returned to clients; the QR secret never leaves the server. */
export type SafeEvent = Omit<Event, "qrSecret">;

export function toSafeEvent(event: Event): SafeEvent {
  const { qrSecret: _secret, ...rest } = event;
  return rest;
}

function eventData(input: EventInput) {
  const startsAt = nyLocalToUtc(input.startsAtLocal);
  const endsAt = nyLocalToUtc(input.endsAtLocal);
  const signupOpensAt = nyLocalToUtc(input.signupOpensAtLocal);
  const signupClosesAt = nyLocalToUtc(input.signupClosesAtLocal);
  if (!(endsAt > startsAt)) throw badRequest("invalid_times", "The event must end after it starts");
  if (endsAt.getTime() - startsAt.getTime() > 24 * 3600_000) {
    throw badRequest("invalid_times", "Events can be at most 24 hours long");
  }
  if (!(signupClosesAt > signupOpensAt)) throw badRequest("invalid_times", "Sign-ups must close after they open");
  if (signupClosesAt > startsAt) throw badRequest("invalid_times", "Sign-ups must close before the event starts");
  const duration = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  if (input.minMinutes > duration) {
    throw badRequest("invalid_min", "The minimum time on site can't be longer than the event");
  }
  return {
    title: input.title,
    partnerOrg: input.partnerOrg || null,
    description: input.description || null,
    instructions: input.instructions || null,
    locationName: input.locationName || null,
    address: input.address || null,
    latitude: input.latitude,
    longitude: input.longitude,
    radiusMeters: input.radiusMeters,
    startsAt,
    endsAt,
    capacity: input.capacity,
    points: input.points,
    minMinutes: input.minMinutes,
    signupOpensAt,
    signupClosesAt,
    checkinMode: input.checkinMode,
    checkinOpensMinBefore: input.checkinOpensMinBefore,
    checkinClosesMinAfter: input.checkinClosesMinAfter,
  };
}

async function loadEvent(id: string) {
  const event = await db.event.findUnique({ where: { id } });
  if (!event) throw notFound("Event not found");
  return event;
}

export async function createEvent(netId: string, input: EventInput) {
  const term = await requireCurrentTerm();
  const event = await db.event.create({
    data: {
      ...eventData(input),
      termId: term.id,
      slug: newSlug(),
      qrSecret: newQrSecret(),
      createdById: netId,
      publishedAt: input.publish ? new Date() : null,
    },
  });
  return toSafeEvent(event);
}

export async function updateEvent(id: string, input: EventInput) {
  const current = await loadEvent(id);
  const data = eventData(input);
  if (current.selectionPublishedAt) {
    const selected = await db.signup.count({ where: { eventId: id, status: "SELECTED" } });
    if (data.capacity < selected) {
      throw badRequest("capacity_too_small", `${selected} people are already confirmed; move some to the waitlist first`);
    }
  }
  const event = await db.event.update({
    where: { id },
    data: {
      ...data,
      publishedAt: input.publish ? (current.publishedAt ?? new Date()) : null,
    },
  });
  return toSafeEvent(event);
}

/**
 * Cancels (or restores) an event and emails the people it affects:
 * everyone signed up on cancel, the confirmed list on restore.
 */
export async function setCanceled(id: string, canceled: boolean) {
  const current = await loadEvent(id);
  if (Boolean(current.canceledAt) === canceled) return { event: toSafeEvent(current), emailed: 0 };
  const event = await db.event.update({ where: { id }, data: { canceledAt: canceled ? new Date() : null } });

  let emailed = 0;
  if (event.publishedAt && event.endsAt > new Date()) {
    const signups = await db.signup.findMany({
      where: { eventId: id, status: canceled ? { in: ["APPLIED", "SELECTED", "WAITLISTED"] } : "SELECTED" },
      select: { netId: true },
    });
    const emails = signups.map((s) => (canceled ? canceledEmail : restoredEmail)(canonicalEmail(s.netId), event));
    emailed = emails.length;
    if (emails.length) after(() => sendEmails(emails));
  }
  return { event: toSafeEvent(event), emailed };
}

export async function deleteEvent(id: string) {
  const event = await loadEvent(id);
  const finalized = await db.signup.count({ where: { eventId: id, outcome: { not: null } } });
  if (finalized > 0 || event.finalizedAt) {
    throw badRequest("has_points", "This event already awarded points. Cancel it instead, or remove the points first.");
  }
  await db.event.delete({ where: { id } });
}

/** Copies an event's settings to a new date, keeping times-of-day and the sign-up lead time. */
export async function duplicateEvent(netId: string, id: string, startsAtLocal: string) {
  const source = await loadEvent(id);
  const term = await requireCurrentTerm();
  const startsAt = nyLocalToUtc(startsAtLocal);
  const shift = startsAt.getTime() - source.startsAt.getTime();
  const at = (d: Date) => new Date(d.getTime() + shift);
  const copy = await db.event.create({
    data: {
      termId: term.id,
      slug: newSlug(),
      qrSecret: newQrSecret(),
      createdById: netId,
      title: source.title,
      partnerOrg: source.partnerOrg,
      description: source.description,
      instructions: source.instructions,
      locationName: source.locationName,
      address: source.address,
      latitude: source.latitude,
      longitude: source.longitude,
      radiusMeters: source.radiusMeters,
      startsAt,
      endsAt: at(source.endsAt),
      capacity: source.capacity,
      points: source.points,
      minMinutes: source.minMinutes,
      signupOpensAt: at(source.signupOpensAt) < new Date() ? new Date() : at(source.signupOpensAt),
      signupClosesAt: at(source.signupClosesAt),
      checkinMode: source.checkinMode,
      checkinOpensMinBefore: source.checkinOpensMinBefore,
      checkinClosesMinAfter: source.checkinClosesMinAfter,
      publishedAt: null, // review before publishing
    },
  });
  return toSafeEvent(copy);
}

export type EventPhase =
  | "draft"
  | "canceled"
  | "signups_upcoming"
  | "signups_open"
  | "needs_selection"
  | "confirmed"
  | "live"
  | "needs_finalize"
  | "finalized";

export function eventPhase(e: Event | SafeEvent, now = new Date()): EventPhase {
  if (e.canceledAt) return "canceled";
  if (!e.publishedAt) return "draft";
  if (e.finalizedAt) return "finalized";
  if (now > e.endsAt) return "needs_finalize";
  if (checkinWindowState(e, now) !== "before" || now >= e.startsAt) return "live";
  if (e.selectionPublishedAt) return "confirmed";
  const signup = signupWindowState(e, now);
  if (signup === "before") return "signups_upcoming";
  if (signup === "open") return "signups_open";
  return "needs_selection";
}

/** Committee list: every event in the current term with counts. */
export async function listEventsForCommittee() {
  const term = await requireCurrentTerm();
  const events = await db.event.findMany({
    where: { termId: term.id },
    orderBy: { startsAt: "asc" },
    include: {
      signups: { select: { status: true, attendance: { select: { id: true } } } },
      reviews: { where: { status: "OPEN" }, select: { id: true } },
    },
  });
  return events.map(({ signups, reviews, ...e }) => ({
    ...toSafeEvent(e as Event),
    phase: eventPhase(e as Event),
    applied: signups.filter((s) => s.status !== "DROPPED" && s.status !== "REMOVED").length,
    selected: signups.filter((s) => s.status === "SELECTED").length,
    waitlisted: signups.filter((s) => s.status === "WAITLISTED").length,
    checkedIn: signups.filter((s) => s.attendance).length,
    openReviews: reviews.length,
  }));
}

export async function getEventForCommittee(id: string) {
  return toSafeEvent(await loadEvent(id));
}

/** Student list: published events in the current term with the viewer's status. */
export async function listEventsForStudent(userId: string) {
  const term = await requireCurrentTerm();
  const events = await db.event.findMany({
    where: { termId: term.id, publishedAt: { not: null } },
    orderBy: { startsAt: "asc" },
    include: {
      signups: { where: { userId }, include: { attendance: true } },
      _count: { select: { signups: { where: { status: { in: ["APPLIED", "SELECTED", "WAITLISTED"] } } } } },
    },
  });
  return events.map(({ signups, _count, ...e }) => ({
    event: toSafeEvent(e as Event),
    mine: signups[0] ?? null,
    interested: _count.signups,
  }));
}

/** One event for a student, with their sign-up and attendance. */
export async function getEventForStudent(slug: string, userId: string) {
  const found = await db.event.findUnique({
    where: { slug },
    include: { term: { select: { lateDropHours: true, noShowPenalty: true } } },
  });
  if (!found || !found.publishedAt) throw notFound("Event not found");
  const { term: rules, ...event } = found;
  const [mine, selectedCount, openReview] = await Promise.all([
    db.signup.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
      include: { attendance: true },
    }),
    db.signup.count({ where: { eventId: event.id, status: "SELECTED" } }),
    db.reviewItem.findFirst({
      where: { eventId: event.id, signup: { userId }, status: { in: ["OPEN", "DENIED", "APPROVED"] } },
      orderBy: { requestedAt: "desc" },
    }),
  ]);
  return { event: toSafeEvent(event), rules, mine, selectedCount, latestReview: openReview };
}

/** Whether this device holds a valid venue pass (from scanning the venue QR). */
export async function hasValidVenuePass(eventId: string, cookieValue: string | undefined) {
  if (!cookieValue) return false;
  const event = await db.event.findUnique({ where: { id: eventId }, select: { qrSecret: true } });
  return event ? verifyVenuePass(event.qrSecret, eventId, cookieValue) : false;
}
