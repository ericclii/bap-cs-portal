import "server-only";
import type { CommitteeRole } from "@/generated/prisma/client";
import { db } from "../db";
import { badRequest, conflict, notFound } from "../http";

export async function listCommittee() {
  const members = await db.committeeMember.findMany({ orderBy: [{ role: "asc" }, { netId: "asc" }] });
  const users = await db.user.findMany({
    where: { netId: { in: members.map((m) => m.netId) } },
    select: { netId: true, name: true, image: true },
  });
  const byNetId = new Map(users.map((u) => [u.netId, u]));
  const bootstrap = (process.env.CHAIR_NETIDS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return {
    members: members.map((m) => ({
      ...m,
      name: byNetId.get(m.netId)?.name ?? null,
      image: byNetId.get(m.netId)?.image ?? null,
      signedIn: byNetId.has(m.netId),
    })),
    bootstrapChairs: bootstrap,
  };
}

export async function addCommitteeMember(netId: string, role: CommitteeRole) {
  const existing = await db.committeeMember.findUnique({ where: { netId } });
  if (existing) throw conflict("already_member", `${netId} is already on the committee`);
  return db.committeeMember.create({ data: { netId, role } });
}

export async function updateCommitteeRole(id: string, role: CommitteeRole) {
  const member = await db.committeeMember.findUnique({ where: { id } });
  if (!member) throw notFound("Member not found");
  if (member.role === "CHAIR" && role !== "CHAIR") await assertAnotherChair(member.netId);
  return db.committeeMember.update({ where: { id }, data: { role } });
}

export async function removeCommitteeMember(id: string) {
  const member = await db.committeeMember.findUnique({ where: { id } });
  if (!member) throw notFound("Member not found");
  if (member.role === "CHAIR") await assertAnotherChair(member.netId);
  await db.committeeMember.delete({ where: { id } });
}

async function assertAnotherChair(exceptNetId: string) {
  const bootstrap = (process.env.CHAIR_NETIDS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const others = await db.committeeMember.count({ where: { role: "CHAIR", netId: { not: exceptNetId } } });
  if (others === 0 && !bootstrap.some((n) => n !== exceptNetId)) {
    throw badRequest("last_chair", "The committee needs at least one chair");
  }
}
