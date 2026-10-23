import { z } from "zod";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { committeeSetStatus } from "@/server/services/signups";

type P = { eventId: string; signupId: string };

export const PATCH = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { eventId, signupId } = await params;
  const { status } = await readJson(req, z.object({ status: z.enum(["SELECTED", "WAITLISTED", "REMOVED"]) }));
  await committeeSetStatus(eventId, signupId, status);
  return json({ ok: true });
});
