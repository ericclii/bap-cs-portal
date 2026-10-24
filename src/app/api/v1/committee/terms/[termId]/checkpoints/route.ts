import { checkpointInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { createCheckpoint, listCheckpoints } from "@/server/services/checkpoints";

type P = { termId: string };

export const GET = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  return json({ checkpoints: await listCheckpoints((await params).termId) });
});

export const POST = route<P>(async (req, { params }) => {
  await requireCommittee(req, "CHAIR");
  const input = await readJson(req, checkpointInput);
  return json({ checkpoint: await createCheckpoint((await params).termId, input) }, { status: 201 });
});
