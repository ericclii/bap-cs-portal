import { json, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { removeCandidate } from "@/server/services/roster";
import { requireCurrentTerm } from "@/server/services/terms";

type P = { candidateId: string };

export const DELETE = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const term = await requireCurrentTerm();
  await removeCandidate(term.id, (await params).candidateId);
  return json({ ok: true });
});
