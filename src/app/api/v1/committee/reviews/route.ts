import { json, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { openReviews } from "@/server/services/attendance";

export const GET = route(async (req) => {
  await requireCommittee(req);
  return json({ reviews: await openReviews() });
});
