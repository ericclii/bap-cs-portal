import { timingSafeEqual } from "node:crypto";
import { json, route, ApiError } from "@/server/http";
import { runScheduledJobs } from "@/server/services/cron";

/** Called by Vercel Cron (or any scheduler) with `Authorization: Bearer $CRON_SECRET`. */
export const GET = route(async (req) => {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const ok = secret && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) throw new ApiError(401, "unauthorized", "Bad cron secret");
  return json(await runScheduledJobs());
});
