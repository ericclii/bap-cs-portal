import { termInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { createTerm, listTerms } from "@/server/services/terms";

export const GET = route(async (req) => {
  await requireCommittee(req);
  return json({ terms: await listTerms() });
});

export const POST = route(async (req) => {
  await requireCommittee(req, "CHAIR");
  const input = await readJson(req, termInput);
  return json({ term: await createTerm(input) }, { status: 201 });
});
