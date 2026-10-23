import { attendedMinutes } from "@/lib/event-window";
import { formatDateTime } from "@/lib/time";
import { csvResponse, toCsv } from "@/server/csv";
import { db } from "@/server/db";
import { notFound, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { eventPeople } from "@/server/services/signups";

type P = { eventId: string };

export const GET = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { eventId } = await params;
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) throw notFound("Event not found");
  const people = await eventPeople(eventId);
  const csv = toCsv(
    ["NetID", "Name", "Candidate", "Status", "Waitlist #", "Signed up", "Checked in", "Checked out", "Minutes", "Early check-out reason", "Outcome", "Points", "Drop reason"],
    people.map((p) => [
      p.netId,
      p.name,
      p.isCandidate ? "yes" : "no",
      p.status.toLowerCase(),
      p.waitlistPos ?? "",
      formatDateTime(p.signedUpAt),
      p.attendance ? formatDateTime(p.attendance.checkedInAt) : "",
      p.attendance?.checkedOutAt ? formatDateTime(p.attendance.checkedOutAt) : "",
      p.attendance ? (attendedMinutes(p.attendance.checkedInAt, p.attendance.checkedOutAt) ?? "") : "",
      p.attendance?.earlyReason ?? "",
      p.outcome?.toLowerCase() ?? "",
      p.points ?? "",
      p.dropReason ?? "",
    ]),
  );
  const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  return csvResponse({ csv, filename: `${slug || "event"}-attendance.csv` });
});
