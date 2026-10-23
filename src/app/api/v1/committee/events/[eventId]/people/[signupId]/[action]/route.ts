import { json, notFound, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { committeeCheckIn, committeeCheckOut, undoCheckIn, undoCheckOut } from "@/server/services/attendance";

type P = { eventId: string; signupId: string; action: string };

const actions = {
  checkin: committeeCheckIn,
  checkout: committeeCheckOut,
  "undo-checkin": undoCheckIn,
  "undo-checkout": undoCheckOut,
} as const;

/** POST …/people/:signupId/{checkin|checkout|undo-checkin|undo-checkout} */
export const POST = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { eventId, signupId, action } = await params;
  const fn = actions[action as keyof typeof actions];
  if (!fn) throw notFound("Unknown action");
  await fn(eventId, signupId);
  return json({ ok: true });
});
