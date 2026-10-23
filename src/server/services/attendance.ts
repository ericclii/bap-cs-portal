import "server-only";
import { after } from "next/server";
import type { Event } from "@/generated/prisma/client";
import { checkinWindowState, checkoutDeadline, checkoutUnlocksAt } from "@/lib/event-window";
import { checkGeofence, distanceMeters } from "@/lib/geo";
import { db } from "../db";
import { committeeEmails, sendEmails } from "../email";
import { committeeAlertEmail } from "../email-templates";
import { ApiError, badRequest, conflict, forbidden, notFound } from "../http";
import type { CurrentUser } from "../session";
import { verifyVenueCode, verifyVenuePass } from "../venue-qr";

type Position = { latitude: number; longitude: number; accuracyM: number };

async function loadMine(user: CurrentUser, eventId: string) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || !event.publishedAt) throw notFound("Event not found");
  if (event.canceledAt) throw badRequest("canceled", "This event was canceled");
  const signup = await db.signup.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
    include: { attendance: true },
  });
  if (!signup || signup.status !== "SELECTED") {
    throw forbidden(
      signup?.status === "WAITLISTED"
        ? "You're on the waitlist, not confirmed for this event"
        : "You're not confirmed for this event",
    );
  }
  return { event, signup };
}

function formatDistance(m: number | null) {
  if (m == null) return "far";
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function verifyLocation(event: Event, position: Position | null | undefined, action: "check in" | "check out") {
  if (!position) throw badRequest("location_required", `Share your location to ${action}`);
  const result = checkGeofence({ latitude: event.latitude, longitude: event.longitude }, event.radiusMeters, position);
  if (!result.ok) {
    throw result.reason === "inaccurate"
      ? new ApiError(400, "location_inaccurate", "Your phone couldn't get a precise location. Try again in a moment, ideally near a window or entrance.", { distanceM: result.distanceM })
      : new ApiError(400, "outside_geofence", `You're about ${formatDistance(result.distanceM)} from the event location. You need to be on site to ${action}.`, { distanceM: result.distanceM });
  }
  return result.distanceM;
}

async function alertCommittee(event: Event, kind: "early_checkout" | "location_review", who: string, detail: string) {
  const recipients = await committeeEmails();
  after(() => sendEmails(recipients.map((to) => committeeAlertEmail(to, event, kind, who, detail))));
}

export async function checkIn(
  user: CurrentUser,
  eventId: string,
  input: { position?: Position | null; venueCode?: string | null },
  venuePassCookie: string | undefined,
) {
  const { event, signup } = await loadMine(user, eventId);
  if (signup.attendance) throw conflict("already_checked_in", "You're already checked in");

  const window = checkinWindowState(event);
  if (window === "before") throw badRequest("checkin_not_open", "Check-in isn't open yet");
  if (window === "closed") throw badRequest("checkin_closed", "Check-in has closed. If you're here, ask the committee to review it.");

  let viaQr = false;
  if (event.checkinMode === "QR") {
    viaQr =
      (input.venueCode != null && verifyVenueCode(event.qrSecret, input.venueCode)) ||
      verifyVenuePass(event.qrSecret, event.id, venuePassCookie);
    if (!viaQr) throw badRequest("venue_qr_required", "Scan the QR code shown by the committee member on site");
  }

  const distanceM = verifyLocation(event, input.position, "check in");
  try {
    return await db.attendance.create({
      data: {
        signupId: signup.id,
        checkedInAt: new Date(),
        checkInMethod: "SELF",
        checkInLat: input.position!.latitude,
        checkInLng: input.position!.longitude,
        checkInAccuracyM: input.position!.accuracyM,
        checkInDistanceM: distanceM,
        checkInViaQr: viaQr,
        lastSeenAt: new Date(),
        lastSeenInside: true,
      },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") throw conflict("already_checked_in", "You're already checked in");
    throw err;
  }
}

export async function checkOut(
  user: CurrentUser,
  eventId: string,
  input: { position?: Position | null; earlyReason?: string | null },
) {
  const { event, signup } = await loadMine(user, eventId);
  const attendance = signup.attendance;
  if (!attendance) throw badRequest("not_checked_in", "You haven't checked in");
  if (attendance.checkedOutAt) throw conflict("already_checked_out", "You've already checked out");
  const now = new Date();
  if (now > checkoutDeadline(event)) throw badRequest("checkout_closed", "Check-out has closed. The committee will review your attendance.");

  const early = now < checkoutUnlocksAt(event, attendance.checkedInAt);
  if (early && !input.earlyReason) {
    throw badRequest("early_reason_required", "Checking out early needs a reason for the committee");
  }
  const distanceM = verifyLocation(event, input.position, "check out");

  const updated = await db.attendance.update({
    where: { id: attendance.id },
    data: {
      checkedOutAt: now,
      checkOutMethod: "SELF",
      checkOutLat: input.position!.latitude,
      checkOutLng: input.position!.longitude,
      checkOutDistanceM: distanceM,
      earlyCheckout: early,
      earlyReason: early ? input.earlyReason : null,
    },
  });

  if (early) {
    await db.reviewItem.create({
      data: {
        eventId,
        signupId: signup.id,
        kind: "EARLY_CHECKOUT",
        message: input.earlyReason,
        latitude: input.position!.latitude,
        longitude: input.position!.longitude,
        accuracyM: input.position!.accuracyM,
        distanceM,
      },
    });
    const minutes = Math.round((now.getTime() - attendance.checkedInAt.getTime()) / 60_000);
    await alertCommittee(event, "early_checkout", `${user.name} (${user.netId})`, `Checked out early after ${minutes} minutes (minimum ${event.minMinutes}). Reason: "${input.earlyReason}".`);
  }
  return updated;
}

/** "My location isn't working": records the attempt for the committee to review. */
export async function requestLocationReview(
  user: CurrentUser,
  eventId: string,
  input: { kind: "CHECKIN_LOCATION" | "CHECKOUT_LOCATION"; message: string; position?: Position | null },
) {
  const { event, signup } = await loadMine(user, eventId);
  if (input.kind === "CHECKIN_LOCATION") {
    if (signup.attendance) throw conflict("already_checked_in", "You're already checked in");
    if (checkinWindowState(event) === "before") throw badRequest("checkin_not_open", "Check-in isn't open yet");
  } else {
    if (!signup.attendance) throw badRequest("not_checked_in", "You haven't checked in");
    if (signup.attendance.checkedOutAt) throw conflict("already_checked_out", "You've already checked out");
  }
  const open = await db.reviewItem.findFirst({ where: { signupId: signup.id, kind: input.kind, status: "OPEN" } });
  if (open) throw conflict("already_requested", "You already asked the committee to review this");

  const distanceM = input.position
    ? Math.round(distanceMeters({ latitude: event.latitude, longitude: event.longitude }, input.position))
    : null;
  const review = await db.reviewItem.create({
    data: {
      eventId,
      signupId: signup.id,
      kind: input.kind,
      message: input.message,
      latitude: input.position?.latitude ?? null,
      longitude: input.position?.longitude ?? null,
      accuracyM: input.position?.accuracyM ?? null,
      distanceM,
    },
  });
  await alertCommittee(
    event,
    "location_review",
    `${user.name} (${user.netId})`,
    `Couldn't verify their location to ${input.kind === "CHECKIN_LOCATION" ? "check in" : "check out"}${distanceM != null ? ` (phone reported ${formatDistance(distanceM)} away)` : " (no location shared)"}. Note: "${input.message}".`,
  );
  return review;
}

/**
 * Best-effort presence while the event page is open: records whether the
 * phone is still inside the geofence. Browsers can't do this in the
 * background; native apps will.
 */
export async function recordPresence(user: CurrentUser, eventId: string, position: Position) {
  const { event, signup } = await loadMine(user, eventId);
  const a = signup.attendance;
  if (!a || a.checkedOutAt) return { tracked: false };
  const result = checkGeofence({ latitude: event.latitude, longitude: event.longitude }, event.radiusMeters, position);
  // Only a confident fix outside counts as leaving; noisy fixes are ignored.
  const inside = result.ok || result.reason === "inaccurate";
  const now = new Date();
  await db.attendance.update({
    where: { id: a.id },
    data: {
      lastSeenAt: now,
      lastSeenInside: inside,
      ...(inside ? {} : { leftAreaAt: a.leftAreaAt ?? now }),
    },
  });
  return { tracked: true, inside };
}

// ---------------------------------------------------------------------------
// Committee actions
// ---------------------------------------------------------------------------

async function loadSignup(eventId: string, signupId: string) {
  const signup = await db.signup.findFirst({ where: { id: signupId, eventId }, include: { attendance: true } });
  if (!signup) throw notFound("Sign-up not found");
  return signup;
}

export async function committeeCheckIn(eventId: string, signupId: string, at?: Date) {
  const signup = await loadSignup(eventId, signupId);
  if (signup.status !== "SELECTED") throw badRequest("not_selected", "Only confirmed people can be checked in");
  if (signup.attendance) throw conflict("already_checked_in", "Already checked in");
  return db.attendance.create({
    data: { signupId, checkedInAt: at ?? new Date(), checkInMethod: "COMMITTEE" },
  });
}

export async function committeeCheckOut(eventId: string, signupId: string, at?: Date) {
  const signup = await loadSignup(eventId, signupId);
  if (!signup.attendance) throw badRequest("not_checked_in", "Not checked in");
  if (signup.attendance.checkedOutAt) throw conflict("already_checked_out", "Already checked out");
  return db.attendance.update({
    where: { id: signup.attendance.id },
    data: { checkedOutAt: at ?? new Date(), checkOutMethod: "COMMITTEE" },
  });
}

export async function undoCheckIn(eventId: string, signupId: string) {
  const signup = await loadSignup(eventId, signupId);
  if (!signup.attendance) throw badRequest("not_checked_in", "Not checked in");
  await db.attendance.delete({ where: { id: signup.attendance.id } });
}

export async function undoCheckOut(eventId: string, signupId: string) {
  const signup = await loadSignup(eventId, signupId);
  if (!signup.attendance?.checkedOutAt) throw badRequest("not_checked_out", "Not checked out");
  return db.attendance.update({
    where: { id: signup.attendance.id },
    data: { checkedOutAt: null, checkOutMethod: null, checkOutLat: null, checkOutLng: null, checkOutDistanceM: null, earlyCheckout: false, earlyReason: null },
  });
}

/** Approve or deny a review request. Approving a location request records the check-in/out. */
export async function resolveReview(reviewId: string, decision: "APPROVED" | "DENIED", note: string | null | undefined, by: string) {
  const review = await db.reviewItem.findUnique({ where: { id: reviewId }, include: { signup: { include: { attendance: true } } } });
  if (!review) throw notFound("Review not found");
  if (review.status !== "OPEN") throw conflict("already_resolved", "This was already resolved");

  await db.$transaction(async (tx) => {
    if (decision === "APPROVED") {
      const a = review.signup.attendance;
      if (review.kind === "CHECKIN_LOCATION" && !a) {
        await tx.attendance.create({
          data: {
            signupId: review.signupId,
            checkedInAt: review.requestedAt,
            checkInMethod: "COMMITTEE",
            checkInLat: review.latitude,
            checkInLng: review.longitude,
            checkInAccuracyM: review.accuracyM,
            checkInDistanceM: review.distanceM,
          },
        });
      }
      if (review.kind === "CHECKOUT_LOCATION" && a && !a.checkedOutAt) {
        await tx.attendance.update({
          where: { id: a.id },
          data: { checkedOutAt: review.requestedAt, checkOutMethod: "COMMITTEE", checkOutLat: review.latitude, checkOutLng: review.longitude, checkOutDistanceM: review.distanceM },
        });
      }
    }
    await tx.reviewItem.update({
      where: { id: reviewId },
      data: { status: decision, resolvedAt: new Date(), resolvedBy: by, resolution: note || null },
    });
  });
}

export async function openReviews() {
  return db.reviewItem.findMany({
    where: { status: "OPEN" },
    include: {
      event: { select: { id: true, title: true, startsAt: true, endsAt: true, latitude: true, longitude: true, radiusMeters: true, minMinutes: true } },
      signup: { select: { netId: true, user: { select: { name: true, image: true } }, attendance: true } },
    },
    orderBy: { requestedAt: "asc" },
  });
}
