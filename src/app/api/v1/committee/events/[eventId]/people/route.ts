import { z } from "zod";
import { netIdField } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { committeeAdd, eventPeople } from "@/server/services/signups";

type P = { eventId: string };

/** Everyone attached to the event, with live attendance; polled by the console. */
export const GET = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  return json({ people: await eventPeople((await params).eventId) }, { headers: { "Cache-Control": "no-store" } });
});

/** Adds someone straight to the confirmed list. */
export const POST = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { netId } = await readJson(req, z.object({ netId: netIdField }));
  await committeeAdd((await params).eventId, netId);
  return json({ ok: true }, { status: 201 });
});
