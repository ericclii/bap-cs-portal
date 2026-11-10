-- Points can be fractional (the committee awards half points).
ALTER TABLE "Event" ALTER COLUMN "points" SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE "Signup" ALTER COLUMN "points" SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE "PointAdjustment" ALTER COLUMN "points" SET DATA TYPE DOUBLE PRECISION;

-- Rows synced from the committee's tracker spreadsheet.
ALTER TABLE "PointAdjustment" ADD COLUMN "source" TEXT;
ALTER TABLE "PointAdjustment" ADD COLUMN "occurredOn" DATE;
CREATE INDEX "PointAdjustment_termId_source_idx" ON "PointAdjustment"("termId", "source");
