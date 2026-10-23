import { signupInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { signUp } from "@/server/services/signups";

type P = { eventId: string };

export const POST = route<P>(async (req, { params }) => {
  const user = await requireApiUser(req);
  const { eventId } = await params;
  const { note } = await readJson(req, signupInput);
  const signup = await signUp(user, eventId, note);
  return json({ status: signup.status, waitlistPos: signup.waitlistPos }, { status: 201 });
});
