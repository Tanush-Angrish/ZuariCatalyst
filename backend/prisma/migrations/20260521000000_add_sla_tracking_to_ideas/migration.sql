-- AddColumns: slaDeadline and slaStage to the ideas table
-- SLA window: 3 days at every idea review stage
-- These are nullable so existing rows default to NULL (no SLA active) with no data loss

ALTER TABLE "ideas" ADD COLUMN "slaDeadline" TIMESTAMP(3);
ALTER TABLE "ideas" ADD COLUMN "slaStage"    TEXT;
