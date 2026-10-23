import { selectionInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { publishSelection, rankSignups } from "@/server/services/signups";

type P = { eventId: string };

/** Suggested ranking: candidates, then fewest points, then earliest sign-up. */
export const GET = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { ranked } = await rankSignups((await params).eventId);
  return json({ ranked });
});

export const POST = route<P>(async (req, { params }) => {
  await requireCommittee(req);
  const { selected, waitlist } = await readJson(req, selectionInput);
  return json(await publishSelection((await params).eventId, selected, waitlist));
});
