import { resolveReviewInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { resolveReview } from "@/server/services/attendance";

type P = { reviewId: string };

export const POST = route<P>(async (req, { params }) => {
  const user = await requireCommittee(req);
  const { decision, note } = await readJson(req, resolveReviewInput);
  await resolveReview((await params).reviewId, decision, note, user.netId);
  return json({ ok: true });
});
