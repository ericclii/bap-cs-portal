import { reviewRequestInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { requestLocationReview } from "@/server/services/attendance";

type P = { eventId: string };

export const POST = route<P>(async (req, { params }) => {
  const user = await requireApiUser(req);
  const { eventId } = await params;
  const input = await readJson(req, reviewRequestInput);
  const review = await requestLocationReview(user, eventId, input);
  return json({ id: review.id }, { status: 201 });
});
