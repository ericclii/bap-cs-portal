-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Checkpoint_termId_idx" ON "Checkpoint"("termId");

-- AddForeignKey
ALTER TABLE "Checkpoint" ADD CONSTRAINT "Checkpoint_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: the chapter's Fall 2026 checkpoints (dated ones fall due at the end of that day in New York).
INSERT INTO "Checkpoint" ("id", "termId", "name", "points", "dueAt")
SELECT gen_random_uuid()::text, t."id", c.name, c.points,
       CASE WHEN c.due IS NULL THEN NULL ELSE ((c.due::timestamp + interval '1 day' - interval '1 millisecond') AT TIME ZONE 'America/New_York') AT TIME ZONE 'UTC' END
FROM "Term" t
CROSS JOIN (VALUES
  ('Checkpoint Alpha', 3, '2026-10-24'),
  ('Checkpoint Bravo', 6, '2026-11-14'),
  ('Membership', 9, NULL),
  ('Gold Standing', 10, NULL),
  ('Platinum Standing', 12, NULL)
) AS c(name, points, due)
WHERE t."name" = 'Fall 2026';

-- Data: any other term's single requirement becomes one end-of-semester checkpoint.
INSERT INTO "Checkpoint" ("id", "termId", "name", "points", "dueAt")
SELECT gen_random_uuid()::text, t."id", 'End of semester', t."requiredPoints", NULL
FROM "Term" t
WHERE t."requiredPoints" IS NOT NULL AND t."name" <> 'Fall 2026';
