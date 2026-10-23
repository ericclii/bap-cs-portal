import { csvResponse } from "@/server/csv";
import { route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { standingsCsv } from "@/server/services/points";
import { requireCurrentTerm } from "@/server/services/terms";

export const GET = route(async (req) => {
  await requireCommittee(req);
  const term = await requireCurrentTerm();
  return csvResponse(await standingsCsv(term.id));
});
