import { json, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { listCheckpoints } from "@/server/services/checkpoints";
import { totalPoints } from "@/server/services/points";
import { getCurrentTerm, } from "@/server/services/terms";
import { isCandidate } from "@/server/services/roster";

export const GET = route(async (req) => {
  const user = await requireApiUser(req);
  const term = await getCurrentTerm();
  return json({
    user,
    term: term && {
      id: term.id,
      name: term.name,
      checkpoints: await listCheckpoints(term.id),
      isCandidate: await isCandidate(term.id, user.netId),
      points: await totalPoints(term.id, user.netId),
    },
  });
});
