import { eventInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { deleteEvent, getEventForCommittee, updateEvent } from "@/server/services/events";

type P = { eventId: string };

export const GET = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  return json({ event: await getEventForCommittee((await params).eventId) });
});

export const PUT = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const input = await readJson(req, eventInput);
  return json({ event: await updateEvent((await params).eventId, input) });
});

export const DELETE = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  await deleteEvent((await params).eventId);
  return json({ ok: true });
});
