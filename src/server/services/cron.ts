import "server-only";
import { canonicalEmail } from "@/lib/netid";
import { db } from "../db";
import { sendEmails } from "../email";
import { reminderEmail } from "../email-templates";

/**
 * Periodic work, triggered by a scheduler hitting /api/cron (Vercel Cron
 * once a day is enough): sends the day-before reminder for every confirmed
 * event starting within the next 36 hours.
 */
export async function runScheduledJobs(now = new Date()) {
  const soon = new Date(now.getTime() + 36 * 3600_000);
  const events = await db.event.findMany({
    where: {
      publishedAt: { not: null },
      selectionPublishedAt: { not: null },
      canceledAt: null,
      reminderSentAt: null,
      startsAt: { gt: now, lte: soon },
    },
    include: {
      signups: { where: { status: "SELECTED" }, select: { netId: true } },
      term: { select: { lateDropHours: true, noShowPenalty: true } },
    },
  });

  let sent = 0;
  for (const event of events) {
    // Claim the event first so overlapping runs never double-send.
    const claimed = await db.event.updateMany({ where: { id: event.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (claimed.count === 0) continue;
    await sendEmails(event.signups.map((s) => reminderEmail(canonicalEmail(s.netId), event)));
    sent += event.signups.length;
  }
  return { events: events.length, remindersSent: sent };
}
