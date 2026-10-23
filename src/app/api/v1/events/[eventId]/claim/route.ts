import { json, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { claimSpot } from "@/server/services/signups";

type P = { eventId: string };

export const POST = route<P>(async (req, { params }) => {
  const user = await requireApiUser(req);
  const { eventId } = await params;
  return json(await claimSpot(user, eventId));
});
