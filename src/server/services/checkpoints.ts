import "server-only";
import { type Checkpoint, dueDateToUtc, sortCheckpoints } from "@/lib/checkpoints";
import { db } from "../db";
import { notFound } from "../http";

export async function listCheckpoints(termId: string): Promise<Checkpoint[]> {
  const rows = await db.checkpoint.findMany({ where: { termId }, select: { id: true, name: true, points: true, dueAt: true } });
  return sortCheckpoints(rows);
}

export async function createCheckpoint(termId: string, input: { name: string; points: number; dueDate: string | null }) {
  const term = await db.term.findUnique({ where: { id: termId } });
  if (!term) throw notFound("Term not found");
  return db.checkpoint.create({
    data: { termId, name: input.name, points: input.points, dueAt: input.dueDate ? dueDateToUtc(input.dueDate) : null },
  });
}

export async function updateCheckpoint(id: string, input: { name?: string; points?: number; dueDate?: string | null }) {
  const found = await db.checkpoint.findUnique({ where: { id } });
  if (!found) throw notFound("Checkpoint not found");
  return db.checkpoint.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.points !== undefined ? { points: input.points } : {}),
      ...(input.dueDate !== undefined ? { dueAt: input.dueDate ? dueDateToUtc(input.dueDate) : null } : {}),
    },
  });
}

export async function deleteCheckpoint(id: string) {
  const found = await db.checkpoint.findUnique({ where: { id } });
  if (!found) throw notFound("Checkpoint not found");
  await db.checkpoint.delete({ where: { id } });
}
