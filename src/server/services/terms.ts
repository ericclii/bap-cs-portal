import "server-only";
import { db } from "../db";
import { badRequest, conflict, notFound } from "../http";

export async function getCurrentTerm() {
  return db.term.findFirst({ where: { isCurrent: true } });
}

/** The current term, or a 400 telling the committee to set one up. */
export async function requireCurrentTerm() {
  const term = await getCurrentTerm();
  if (!term) throw badRequest("no_term", "Set up the current term first (Committee → Manage)");
  return term;
}

export async function listTerms() {
  return db.term.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { candidates: true, events: true } },
      checkpoints: { select: { id: true, name: true, points: true, dueAt: true } },
    },
  });
}

export async function createTerm(input: { name: string; makeCurrent: boolean }) {
  const existing = await db.term.findUnique({ where: { name: input.name } });
  if (existing) throw conflict("term_exists", `${input.name} already exists`);
  // A new term starts with the current term's points rules.
  const previous = await getCurrentTerm();
  return db.$transaction(async (tx) => {
    if (input.makeCurrent) await tx.term.updateMany({ data: { isCurrent: false } });
    return tx.term.create({
      data: {
        name: input.name,
        isCurrent: input.makeCurrent,
        ...(previous
          ? {
              defaultEventPoints: previous.defaultEventPoints,
              noShowPenalty: previous.noShowPenalty,
              lateDropHours: previous.lateDropHours,
            }
          : {}),
      },
    });
  });
}

export async function updateTerm(
  id: string,
  input: {
    makeCurrent?: boolean;
    name?: string;
    defaultEventPoints?: number;
    noShowPenalty?: number;
    lateDropHours?: number;
  },
) {
  const term = await db.term.findUnique({ where: { id } });
  if (!term) throw notFound("Term not found");
  return db.$transaction(async (tx) => {
    if (input.makeCurrent) await tx.term.updateMany({ data: { isCurrent: false } });
    return tx.term.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.makeCurrent ? { isCurrent: true } : {}),
        ...(input.defaultEventPoints !== undefined ? { defaultEventPoints: input.defaultEventPoints } : {}),
        ...(input.noShowPenalty !== undefined ? { noShowPenalty: input.noShowPenalty } : {}),
        ...(input.lateDropHours !== undefined ? { lateDropHours: input.lateDropHours } : {}),
      },
    });
  });
}
