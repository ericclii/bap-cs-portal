import { z } from "zod";
import { json, readJson, route } from "@/server/http";
import { requireCommittee } from "@/server/session";
import { removeCommitteeMember, updateCommitteeRole } from "@/server/services/committee";

type P = { memberId: string };

export const PATCH = route<P>(async (req, { params }) => {
  await requireCommittee(req, "CHAIR");
  const { role } = await readJson(req, z.object({ role: z.enum(["CHAIR", "MEMBER"]) }));
  return json({ member: await updateCommitteeRole((await params).memberId, role) });
});

export const DELETE = route<P>(async (req, { params }) => {
  await requireCommittee(req, "CHAIR");
  await removeCommitteeMember((await params).memberId);
  return json({ ok: true });
});
