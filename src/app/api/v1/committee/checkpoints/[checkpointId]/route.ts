import { checkpointUpdateInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { deleteCheckpoint, updateCheckpoint } from "@/server/services/checkpoints";

type P = { checkpointId: string };

export const PATCH = route<P>(async (req, { params }) => {
  await requireCommittee(req, "CHAIR");
  const input = await readJson(req, checkpointUpdateInput);
  return json({ checkpoint: await updateCheckpoint((await params).checkpointId, input) });
});

export const DELETE = route<P>(async (req, { params }) => {
  await requireCommittee(req, "CHAIR");
  await deleteCheckpoint((await params).checkpointId);
  return json({ ok: true });
});
