import { outcomeInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { finalizeEvent, finalizePreview } from "@/server/services/finalize";

type P = { eventId: string };

export const GET = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { rows, noShowPenalty } = await finalizePreview((await params).eventId);
  return json({ rows, noShowPenalty });
});

export const POST = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { outcomes } = await readJson(req, outcomeInput);
  return json(await finalizeEvent((await params).eventId, outcomes));
});
