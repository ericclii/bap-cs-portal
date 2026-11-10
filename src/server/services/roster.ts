import "server-only";
import { db } from "../db";
import { notFound } from "../http";

export async function listCandidates(termId: string) {
  const candidates = await db.candidate.findMany({ where: { termId }, orderBy: { netId: "asc" } });
  const users = await db.user.findMany({
    where: { netId: { in: candidates.map((c) => c.netId) } },
    select: { netId: true, name: true, image: true },
  });
  const byNetId = new Map(users.map((u) => [u.netId, u]));
  return candidates.map((c) => ({
    id: c.id,
    netId: c.netId,
    name: byNetId.get(c.netId)?.name ?? c.name,
    image: byNetId.get(c.netId)?.image ?? null,
    signedIn: byNetId.has(c.netId),
  }));
}

/** Adds (or with `replace`, sets) the term's candidate roster. */
export async function saveCandidates(
  termId: string,
  rows: { netId: string; name?: string | null }[],
  replace: boolean,
) {
  const netIds = [...new Set(rows.map((r) => r.netId))];
  return db.$transaction(async (tx) => {
    let removed = 0;
    if (replace) {
      removed = (await tx.candidate.deleteMany({ where: { termId, netId: { notIn: netIds } } })).count;
    }
    const existing = await tx.candidate.findMany({ where: { termId, netId: { in: netIds } }, select: { netId: true } });
    const have = new Set(existing.map((e) => e.netId));
    const seen = new Set<string>();
    const toCreate = rows.filter((r) => !have.has(r.netId) && !seen.has(r.netId) && seen.add(r.netId));
    await tx.candidate.createMany({
      data: toCreate.map((r) => ({ termId, netId: r.netId, name: r.name ?? null })),
      skipDuplicates: true,
    });
    // Fill in names we didn't have before.
    for (const r of rows) {
      if (r.name && have.has(r.netId)) {
        await tx.candidate.updateMany({ where: { termId, netId: r.netId, name: null }, data: { name: r.name } });
      }
    }
    return { added: toCreate.length, alreadyListed: have.size, removed };
  });
}

export async function removeCandidate(termId: string, id: string) {
  const c = await db.candidate.findFirst({ where: { id, termId } });
  if (!c) throw notFound("Candidate not found");
  await db.candidate.delete({ where: { id } });
}

/** Empties the term's roster. Points and history are kept. */
export async function clearCandidates(termId: string) {
  const { count } = await db.candidate.deleteMany({ where: { termId } });
  return { removed: count };
}

export async function isCandidate(termId: string, netId: string) {
  return (await db.candidate.count({ where: { termId, netId } })) > 0;
}
