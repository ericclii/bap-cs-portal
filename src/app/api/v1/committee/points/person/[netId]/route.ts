import { json, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { personHistory } from "@/server/services/points";
import { requireCurrentTerm } from "@/server/services/terms";

type P = { netId: string };

export const GET = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const term = await requireCurrentTerm();
  return json(await personHistory(term.id, (await params).netId.toLowerCase()));
});
