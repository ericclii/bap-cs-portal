import { termUpdateInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { updateTerm } from "@/server/services/terms";

type P = { termId: string };

export const PATCH = route<P>(async (req, { params }) => {
  await requireCommittee(req, "CHAIR");
  const input = await readJson(req, termUpdateInput);
  return json({ term: await updateTerm((await params).termId, input) });
});
