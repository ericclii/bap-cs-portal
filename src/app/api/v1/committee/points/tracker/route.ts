import { trackerSyncInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { syncTracker } from "@/server/services/points";
import { requireCurrentTerm } from "@/server/services/terms";

export const POST = route(async (req) => {
  const user = await requireCommittee(req, "CHAIR");
  const term = await requireCurrentTerm();
  const { people, replaceRoster } = await readJson(req, trackerSyncInput);
  return json(await syncTracker(term.id, people, replaceRoster, user.netId));
});
