-- Add missing columns to `ideas` table
ALTER TABLE "ideas" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "ideas" ADD COLUMN IF NOT EXISTS "approvedByUserId" INTEGER;
ALTER TABLE "ideas" ADD COLUMN IF NOT EXISTS "approvedByRole" TEXT;

-- Add missing columns to `projects` table
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "isStepsFinalized" BOOLEAN NOT NULL DEFAULT false;

-- Add missing column to `project_steps` table
ALTER TABLE "project_steps" ADD COLUMN IF NOT EXISTS "dependencyStepId" INTEGER;

-- AddForeignKey: ideas.approvedByUserId → users.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ideas_approvedByUserId_fkey'
  ) THEN
    ALTER TABLE "ideas" ADD CONSTRAINT "ideas_approvedByUserId_fkey"
      FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: project_steps.dependencyStepId → project_steps.id (self-referential)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_steps_dependencyStepId_fkey'
  ) THEN
    ALTER TABLE "project_steps" ADD CONSTRAINT "project_steps_dependencyStepId_fkey"
      FOREIGN KEY ("dependencyStepId") REFERENCES "project_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: projects.ideaId → ideas.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_ideaId_fkey'
  ) THEN
    ALTER TABLE "projects" ADD CONSTRAINT "projects_ideaId_fkey"
      FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
