import { json, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { listEventsForStudent } from "@/server/services/events";

/** Published events this term, with the caller's sign-up status. */
export const GET = route(async (req) => {
  const user = await requireApiUser(req);
  return json({ events: await listEventsForStudent(user.id) });
});
