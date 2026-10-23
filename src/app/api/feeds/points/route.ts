import { csvResponse } from "@/server/csv";
import { ApiError, route } from "@/server/http";
import { verifyFeedToken } from "@/server/feed-token";
import { standingsCsv } from "@/server/services/points";
import { requireCurrentTerm } from "@/server/services/terms";

/**
 * Read-only CSV of the current term's points, for Google Sheets:
 * =IMPORTDATA("https://…/api/feeds/points?token=…")
 */
export const GET = route(async (req) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!verifyFeedToken(token)) throw new ApiError(401, "unauthorized", "Invalid feed token");
  const term = await requireCurrentTerm();
  const res = csvResponse(await standingsCsv(term.id));
  res.headers.set("Content-Disposition", "inline");
  return res;
});
