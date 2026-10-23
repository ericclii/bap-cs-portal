import { eventInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { createEvent, listEventsForCommittee } from "@/server/services/events";

export const GET = route(async (req) => {
  await requireCommittee(req);
  return json({ events: await listEventsForCommittee() });
});

export const POST = route(async (req) => {
  const user = await requireCommittee(req);
  const input = await readJson(req, eventInput);
  return json({ event: await createEvent(user.netId, input) }, { status: 201 });
});
