import { cookies } from "next/headers";
import { checkInInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { checkIn } from "@/server/services/attendance";
import { venuePassCookieName } from "@/server/venue-qr";

type P = { eventId: string };

export const POST = route<P>(async (req, { params }) => {
  const user = await requireApiUser(req);
  const { eventId } = await params;
  const input = await readJson(req, checkInInput);
  const pass = (await cookies()).get(venuePassCookieName(eventId))?.value;
  const attendance = await checkIn(user, eventId, input, pass);
  return json({ checkedInAt: attendance.checkedInAt }, { status: 201 });
});
