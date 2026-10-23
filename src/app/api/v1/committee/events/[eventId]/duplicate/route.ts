import { z } from "zod";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { duplicateEvent } from "@/server/services/events";

type P = { eventId: string };

export const POST = route<P>(async (req, { params }) => {
  const user = await requireCommittee(req);
  const { startsAtLocal } = await readJson(req, z.object({ startsAtLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/) }));
  return json({ event: await duplicateEvent(user.netId, (await params).eventId, startsAtLocal) }, { status: 201 });
});
