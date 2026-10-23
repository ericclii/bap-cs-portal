import { checkOutInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireApiUser } from "@/server/session";
import { checkOut } from "@/server/services/attendance";

type P = { eventId: string };

export const POST = route<P>(async (req, { params }) => {
  const user = await requireApiUser(req);
  const { eventId } = await params;
  const input = await readJson(req, checkOutInput);
  const a = await checkOut(user, eventId, input);
  return json({ checkedOutAt: a.checkedOutAt, early: a.earlyCheckout });
});
