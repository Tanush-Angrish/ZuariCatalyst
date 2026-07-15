-- AlterTable
ALTER TABLE "ideas" ADD COLUMN "approvalRemarks" TEXT;

-- AlterTable
ALTER TABLE "idea_templates" ADD COLUMN "isFallback" BOOLEAN NOT NULL DEFAULT false;
