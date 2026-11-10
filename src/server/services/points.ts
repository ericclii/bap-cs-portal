import "server-only";
import { db } from "../db";
import { toCsv } from "../csv";
import { listCheckpoints } from "./checkpoints";

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
  for (const a of adjustments) {
    const s = get(a.netId);
    s.adjustmentPoints += a.points;
    // Each tracker cell is one event: points earned means attended, negative means a no-show.
    if (a.source === "tracker") {
      if (a.points > 0) s.attended++;
      else if (a.points < 0) s.noShows++;
    }
  }

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
    db.pointAdjustment.findMany({ where: { netId, termId }, orderBy: [{ occurredOn: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] }),
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

/**
 * Makes the term match the committee's tracker sheet: every tracker row
 * from the last sync is replaced by this one (so re-uploading never doubles
 * up), and with `replaceRoster` the roster becomes exactly these people.
 * Points added in the app and in-app events are left alone.
 */
export async function syncTracker(
  termId: string,
  people: { netId: string; name?: string | null; entries: { label: string; points: number; month: number | null; day: number | null }[] }[],
  replaceRoster: boolean,
  by: string,
) {
  const term = await db.term.findUniqueOrThrow({ where: { id: termId } });
  const year = Number(term.name.match(/\d{4}/)?.[0] ?? new Date().getFullYear());
  const unique = [...new Map(people.map((p) => [p.netId, p])).values()];
  const netIds = unique.map((p) => p.netId);
  const rows = unique.flatMap((p) =>
    p.entries
      .filter((e) => e.points !== 0)
      .map((e) => ({
        termId,
        netId: p.netId,
        points: e.points,
        reason: e.label,
        source: "tracker",
        occurredOn: e.month && e.day ? new Date(Date.UTC(year, e.month - 1, e.day)) : null,
        createdBy: by,
      })),
  );

  return db.$transaction(async (tx) => {
    const replaced = (await tx.pointAdjustment.deleteMany({ where: { termId, source: "tracker" } })).count;
    await tx.pointAdjustment.createMany({ data: rows });

    let removed = 0;
    if (replaceRoster) removed = (await tx.candidate.deleteMany({ where: { termId, netId: { notIn: netIds } } })).count;
    const existing = new Set((await tx.candidate.findMany({ where: { termId, netId: { in: netIds } }, select: { netId: true } })).map((c) => c.netId));
    await tx.candidate.createMany({
      data: unique.filter((p) => !existing.has(p.netId)).map((p) => ({ termId, netId: p.netId, name: p.name ?? null })),
      skipDuplicates: true,
    });
    for (const p of unique) {
      if (p.name && existing.has(p.netId)) await tx.candidate.updateMany({ where: { termId, netId: p.netId }, data: { name: p.name } });
    }
    return {
      people: unique.length,
      entries: rows.length,
      points: rows.reduce((s, r) => s + r.points, 0),
      replaced,
      added: unique.length - existing.size,
      removed,
    };
  }, { timeout: 30_000 });
}

export async function standingsCsv(termId: string) {
  const term = await db.term.findUniqueOrThrow({ where: { id: termId } });
  const [rows, checkpoints] = await Promise.all([termStandings(termId), listCheckpoints(termId)]);
  const csv = toCsv(
    ["NetID", "Email", "Name", "Candidate", "Total points", "Event points", "Adjustments", "Attended", "No-shows", "Excused", ...checkpoints.map((c) => `${c.name} (${c.points})`)],
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
      ...checkpoints.map((c) => (s.total >= c.points ? "yes" : "no")),
    ]),
  );
  return { csv, filename: `bap-cs-points-${term.name.toLowerCase().replace(/\s+/g, "-")}.csv` };
}
