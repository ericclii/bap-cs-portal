import { z } from "zod";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { setCanceled } from "@/server/services/events";

type P = { eventId: string };

export const POST = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { canceled } = await readJson(req, z.object({ canceled: z.boolean() }));
  return json(await setCanceled((await params).eventId, canceled));
});
