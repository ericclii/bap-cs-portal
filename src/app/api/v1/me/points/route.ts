import { json, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { personHistory } from "@/server/services/points";
import { requireCurrentTerm } from "@/server/services/terms";

export const GET = route(async (req) => {
  const user = await requireApiUser(req);
  const term = await requireCurrentTerm();
  return json(await personHistory(term.id, user.netId));
});
