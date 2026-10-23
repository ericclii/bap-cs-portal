import { committeeInput } from "@/lib/contracts";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { addCommitteeMember, listCommittee } from "@/server/services/committee";

export const GET = route(async (req) => {
  await requireCommittee(req);
  return json(await listCommittee());
});

export const POST = route(async (req) => {
  await requireCommittee(req, "CHAIR");
  const { netId, role } = await readJson(req, committeeInput);
  return json({ member: await addCommitteeMember(netId, role) }, { status: 201 });
});
