import { z } from "zod";
import { json, readJson, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { drop } from "@/server/services/signups";

type P = { eventId: string };

export const POST = route<P>(async (req, { params }) => {
  const user = await requireApiUser(req);
  const { eventId } = await params;
  const { reason } = await readJson(req, z.object({ reason: z.string().trim().max(500).nullish() }));
  return json(await drop(user, eventId, reason || null));
});
