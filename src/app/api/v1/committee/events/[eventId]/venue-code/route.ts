import { db } from "@/server/db";
import { appUrl } from "@/server/email";
import { json, notFound, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { currentVenueCode, STEP_SECONDS } from "@/server/venue-qr";

type P = { eventId: string };

/** Current rotating code for the on-site QR screen, plus live counts. */
export const GET = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { eventId } = await params;
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) throw notFound("Event not found");
  const { code, rotatesAt } = currentVenueCode(event.qrSecret);
  const [checkedIn, confirmed] = await Promise.all([
    db.attendance.count({ where: { signup: { eventId } } }),
    db.signup.count({ where: { eventId, status: "SELECTED" } }),
  ]);
  return json(
    { code, url: appUrl(`/events/${event.slug}/scan?c=${code}`), rotatesAt, stepSeconds: STEP_SECONDS, checkedIn, confirmed },
    { headers: { "Cache-Control": "no-store" } },
  );
});
