import "server-only";
import { db } from "../db";
import { toCsv } from "../csv";

export type Standing = {
  netId: string;
  name: string | null;
  isCandidate: boolean;
  eventPoints: number;
  adjustmentPoints: number;
  total: number;
  attended: number;
  noShows: number;
  excused: number;
  pendingEvents: number;
};

/** Everyone with points activity (or on the roster) in a term. */
export async function termStandings(termId: string): Promise<Standing[]> {
  const [candidates, signups, adjustments] = await Promise.all([
    db.candidate.findMany({ where: { termId } }),
    db.signup.findMany({
      where: { event: { termId, canceledAt: null }, wasSelected: true },
      select: { netId: true, outcome: true, points: true, user: { select: { name: true } }, event: { select: { finalizedAt: true } } },
    }),
    db.pointAdjustment.findMany({ where: { termId } }),
  ]);

  const map = new Map<string, Standing>();
  const get = (netId: string) => {
    let s = map.get(netId);
    if (!s) {
      s = { netId, name: null, isCandidate: false, eventPoints: 0, adjustmentPoints: 0, total: 0, attended: 0, noShows: 0, excused: 0, pendingEvents: 0 };
      map.set(netId, s);
    }
    return s;
  };

  for (const c of candidates) {
    const s = get(c.netId);
    s.isCandidate = true;
    s.name ??= c.name;
  }
  for (const su of signups) {
    const s = get(su.netId);
    if (su.user?.name) s.name = su.user.name;
    if (!su.outcome) {
      if (!su.event.finalizedAt) s.pendingEvents++;
      continue;
    }
    s.eventPoints += su.points ?? 0;
    if (su.outcome === "ATTENDED") s.attended++;
    else if (su.outcome === "NO_SHOW") s.noShows++;
    else s.excused++;
  }
  for (const a of adjustments) get(a.netId).adjustmentPoints += a.points;

  // Prefer names people chose on their Google account.
  const users = await db.user.findMany({ where: { netId: { in: [...map.keys()] } }, select: { netId: true, name: true } });
  for (const u of users) if (u.netId && u.name) map.get(u.netId)!.name = u.name;

  return [...map.values()]
    .map((s) => ({ ...s, total: s.eventPoints + s.adjustmentPoints }))
    .sort((a, b) => Number(b.isCandidate) - Number(a.isCandidate) || (a.name ?? a.netId).localeCompare(b.name ?? b.netId));
}

export async function totalPoints(termId: string, netId: string): Promise<number> {
  const [events, adjustments] = await Promise.all([
    db.signup.aggregate({ where: { netId, event: { termId, canceledAt: null }, outcome: { not: null } }, _sum: { points: true } }),
    db.pointAdjustment.aggregate({ where: { netId, termId }, _sum: { points: true } }),
  ]);
  return (events._sum.points ?? 0) + (adjustments._sum.points ?? 0);
}

/** Points per NetID for ranking sign-ups. */
export async function totalsFor(termId: string, netIds: string[]): Promise<Map<string, number>> {
  const [events, adjustments] = await Promise.all([
    db.signup.groupBy({
      by: ["netId"],
      where: { netId: { in: netIds }, event: { termId, canceledAt: null }, outcome: { not: null } },
      _sum: { points: true },
    }),
    db.pointAdjustment.groupBy({ by: ["netId"], where: { netId: { in: netIds }, termId }, _sum: { points: true } }),
  ]);
  const totals = new Map<string, number>(netIds.map((n) => [n, 0]));
  for (const e of events) totals.set(e.netId, (totals.get(e.netId) ?? 0) + (e._sum.points ?? 0));
  for (const a of adjustments) totals.set(a.netId, (totals.get(a.netId) ?? 0) + (a._sum.points ?? 0));
  return totals;
}

/** A person's full point history in a term. */
export async function personHistory(termId: string, netId: string) {
  const [signups, adjustments] = await Promise.all([
    db.signup.findMany({
      where: { netId, event: { termId } },
      include: {
        event: { select: { id: true, slug: true, title: true, partnerOrg: true, startsAt: true, endsAt: true, points: true, finalizedAt: true, canceledAt: true } },
        attendance: true,
      },
      orderBy: { event: { startsAt: "desc" } },
    }),
    db.pointAdjustment.findMany({ where: { netId, termId }, orderBy: { createdAt: "desc" } }),
  ]);
  return { signups, adjustments };
}

export async function addAdjustments(termId: string, netIds: string[], points: number, reason: string, by: string) {
  const unique = [...new Set(netIds)];
  await db.pointAdjustment.createMany({
    data: unique.map((netId) => ({ termId, netId, points, reason, createdBy: by })),
  });
  return { count: unique.length };
}

export async function deleteAdjustment(id: string) {
  await db.pointAdjustment.delete({ where: { id } });
}

export async function importPoints(
  termId: string,
  rows: { netId: string; name?: string | null; points: number }[],
  reason: string,
  by: string,
) {
  const nonZero = rows.filter((r) => r.points !== 0);
  await db.pointAdjustment.createMany({
    data: nonZero.map((r) => ({ termId, netId: r.netId, points: r.points, reason, createdBy: by })),
  });
  return { imported: nonZero.length, skippedZero: rows.length - nonZero.length };
}

export async function standingsCsv(termId: string) {
  const term = await db.term.findUniqueOrThrow({ where: { id: termId } });
  const rows = await termStandings(termId);
  const csv = toCsv(
    ["NetID", "Email", "Name", "Candidate", "Total points", "Event points", "Adjustments", "Attended", "No-shows", "Excused", "Required", "Met requirement"],
    rows.map((s) => [
      s.netId,
      `${s.netId}@nyu.edu`,
      s.name ?? "",
      s.isCandidate ? "yes" : "no",
      s.total,
      s.eventPoints,
      s.adjustmentPoints,
      s.attended,
      s.noShows,
      s.excused,
      term.requiredPoints ?? "",
      term.requiredPoints != null ? (s.total >= term.requiredPoints ? "yes" : "no") : "",
    ]),
  );
  return { csv, filename: `bap-cs-points-${term.name.toLowerCase().replace(/\s+/g, "-")}.csv` };
}
