import { importPointsInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { importPoints } from "@/server/services/points";
import { requireCurrentTerm } from "@/server/services/terms";

export const POST = route(async (req) => {
  const user = await requireCommittee(req, "CHAIR");
  const term = await requireCurrentTerm();
  const { rows, reason } = await readJson(req, importPointsInput);
  return json(await importPoints(term.id, rows, reason, user.netId), { status: 201 });
});
