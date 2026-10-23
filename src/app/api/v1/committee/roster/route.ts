import { rosterInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { listCandidates, saveCandidates } from "@/server/services/roster";
import { requireCurrentTerm } from "@/server/services/terms";

export const GET = route(async (req) => {
  await requireCommittee(req);
  const term = await requireCurrentTerm();
  return json({ term, candidates: await listCandidates(term.id) });
});

export const POST = route(async (req) => {
  await requireCommittee(req);
  const term = await requireCurrentTerm();
  const { rows, replace } = await readJson(req, rosterInput);
  return json(await saveCandidates(term.id, rows, replace));
});
