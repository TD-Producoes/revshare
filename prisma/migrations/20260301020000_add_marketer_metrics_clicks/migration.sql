-- Add clicks count to marketer metrics snapshots
ALTER TABLE "MarketerMetricsSnapshot" ADD COLUMN "clicksCountDay" INTEGER NOT NULL DEFAULT 0;
