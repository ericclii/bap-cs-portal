import { adjustmentInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { addAdjustments, termStandings } from "@/server/services/points";
import { requireCurrentTerm } from "@/server/services/terms";

export const GET = route(async (req) => {
  await requireCommittee(req);
  const term = await requireCurrentTerm();
  return json({ term, standings: await termStandings(term.id) });
});

/** Manual points (e.g. card-writing at a meeting) for one or more people. */
export const POST = route(async (req) => {
  const user = await requireCommittee(req);
  const term = await requireCurrentTerm();
  const { netIds, points, reason } = await readJson(req, adjustmentInput);
  return json(await addAdjustments(term.id, netIds, points, reason, user.netId), { status: 201 });
});
