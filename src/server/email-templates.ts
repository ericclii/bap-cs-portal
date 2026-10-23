import "server-only";
import { formatDateTime, formatEventRange, formatTime } from "@/lib/time";
import { appUrl, type OutgoingEmail } from "./email";

type EventInfo = {
  id: string;
  slug: string;
  title: string;
  partnerOrg: string | null;
  locationName: string | null;
  address: string | null;
  instructions: string | null;
  startsAt: Date;
  endsAt: Date;
  points: number;
  minMinutes: number;
  checkinMode: "LINK" | "QR";
  term?: { lateDropHours: number; noShowPenalty: number };
};

function lateDropRule(e: EventInfo): string {
  const hours = e.term?.lateDropHours ?? 24;
  const penalty = Math.abs(e.term?.noShowPenalty ?? -1);
  return `Drops within ${hours} hours of the start may cost ${penalty} point${penalty === 1 ? "" : "s"} unless the committee excuses them.`;
}

const SIGNOFF = "\n\n— BAP Community Service Committee";

function eventBlock(e: EventInfo): string {
  const lines = [
    `${e.title}${e.partnerOrg ? ` with ${e.partnerOrg}` : ""}`,
    formatEventRange(e.startsAt, e.endsAt),
    [e.locationName, e.address].filter(Boolean).join(", "),
  ].filter(Boolean);
  return lines.map((l) => `  ${l}`).join("\n");
}

function checkinHowTo(e: EventInfo): string {
  const how =
    e.checkinMode === "QR"
      ? "When you arrive, scan the QR code shown by the BAP committee member on site, then tap Check in."
      : "When you arrive, open your event page and tap Check in. Your phone will ask for your location once.";
  return `${how}\nEvent page: ${appUrl(`/events/${e.slug}`)}`;
}

export function selectedEmail(to: string, e: EventInfo): OutgoingEmail {
  return {
    to,
    eventId: e.id,
    kind: "selected",
    subject: `You're confirmed: ${e.title}`,
    text: `You're confirmed for this community service event:\n\n${eventBlock(e)}\n\n${checkinHowTo(e)}${
      e.instructions ? `\n\nWhat to know:\n${e.instructions}` : ""
    }\n\nCan't make it anymore? Drop out from the event page as early as possible so someone on the waitlist can take your spot. ${lateDropRule(e)}${SIGNOFF}`,
  };
}

export function waitlistedEmail(to: string, e: EventInfo, position: number): OutgoingEmail {
  return {
    to,
    eventId: e.id,
    kind: "waitlisted",
    subject: `Waitlisted (#${position}): ${e.title}`,
    text: `This event filled up, so you're #${position} on the waitlist:\n\n${eventBlock(e)}\n\nIf a spot opens, we'll email you right away. Event page: ${appUrl(`/events/${e.slug}`)}${SIGNOFF}`,
  };
}

export function promotedEmail(to: string, e: EventInfo): OutgoingEmail {
  const base = selectedEmail(to, e);
  return { ...base, kind: "promoted", subject: `A spot opened up. You're confirmed: ${e.title}` };
}

export function spotOpenEmail(to: string, e: EventInfo): OutgoingEmail {
  return {
    to,
    eventId: e.id,
    kind: "spot_open",
    subject: `Spot open, first to claim: ${e.title}`,
    text: `Someone dropped out of an event you're waitlisted for:\n\n${eventBlock(e)}\n\nThe spot goes to whoever claims it first. Claim it here: ${appUrl(`/events/${e.slug}`)}${SIGNOFF}`,
  };
}

export function reminderEmail(to: string, e: EventInfo): OutgoingEmail {
  return {
    to,
    eventId: e.id,
    kind: "reminder",
    subject: `Reminder: ${e.title}, ${formatDateTime(e.startsAt)}`,
    text: `See you soon!\n\n${eventBlock(e)}\n\n${checkinHowTo(e)}\n\nPlan to stay until the end. You can check out normally after ${Math.round(e.minMinutes / 6) / 10} hours on site.${
      e.instructions ? `\n\nWhat to know:\n${e.instructions}` : ""
    }${SIGNOFF}`,
  };
}

export function pointsRecordedEmail(
  to: string,
  e: EventInfo,
  outcome: "ATTENDED" | "NO_SHOW" | "EXCUSED",
  points: number,
  termTotal: number,
  required: number | null,
): OutgoingEmail {
  const what =
    outcome === "ATTENDED"
      ? `You attended: ${points >= 0 ? "+" : ""}${points} points awarded.`
      : outcome === "EXCUSED"
        ? "Your absence was excused: no points added or removed."
        : `You were marked as a no-show: ${points} point${Math.abs(points) === 1 ? "" : "s"}.`;
  return {
    to,
    eventId: e.id,
    kind: "points_recorded",
    subject: `Points awarded: ${e.title}`,
    text: `${what}\n\n${eventBlock(e)}\n\nYour total this term: ${termTotal}${required ? ` of ${required} required` : ""} points.\nSee your history: ${appUrl("/")}\n\nThink this is wrong? Reply to this email.${SIGNOFF}`,
  };
}

export function canceledEmail(to: string, e: EventInfo): OutgoingEmail {
  return {
    to,
    eventId: e.id,
    kind: "canceled",
    subject: `Canceled: ${e.title}`,
    text: `This community service event has been canceled:\n\n${eventBlock(e)}\n\nYou don't need to do anything, and this won't affect your points. Look for other events at ${appUrl("/")}.${SIGNOFF}`,
  };
}

export function restoredEmail(to: string, e: EventInfo): OutgoingEmail {
  return {
    to,
    eventId: e.id,
    kind: "restored",
    subject: `Back on: ${e.title}`,
    text: `Good news: this event is happening after all, and you're still confirmed:\n\n${eventBlock(e)}\n\n${checkinHowTo(e)}${SIGNOFF}`,
  };
}

export function committeeAlertEmail(
  to: string,
  e: EventInfo,
  kind: "early_checkout" | "location_review" | "late_drop",
  who: string,
  detail: string,
): OutgoingEmail {
  const subject = {
    early_checkout: `Early check-out: ${who} at ${e.title}`,
    location_review: `Location review needed: ${who} at ${e.title}`,
    late_drop: `Late drop: ${who} from ${e.title}`,
  }[kind];
  return {
    to,
    eventId: e.id,
    kind: `alert_${kind}`,
    subject,
    text: `${who}: ${detail}\n\n${eventBlock(e)}\n\nReview it here: ${appUrl(`/committee/events/${e.id}`)}\n\n(Sent at ${formatTime(new Date())}.)`,
  };
}
