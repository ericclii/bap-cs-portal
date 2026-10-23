import { presenceInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { recordPresence } from "@/server/services/attendance";

type P = { eventId: string };

export const POST = route<P>(async (req, { params }) => {
  const user = await requireApiUser(req);
  const { eventId } = await params;
  const { position } = await readJson(req, presenceInput);
  return json(await recordPresence(user, eventId, position));
});
