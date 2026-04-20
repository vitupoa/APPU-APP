-- CreateEnum for judge invite status (skip if exists)
DO $$ BEGIN
  CREATE TYPE "JudgeInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable for judge_invites (skip if exists)
CREATE TABLE IF NOT EXISTS "judge_invites" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "judge_id" TEXT NOT NULL,
    "status" "JudgeInviteStatus" NOT NULL DEFAULT 'PENDING',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judge_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "judge_invites_judge_id_idx" ON "judge_invites"("judge_id");
CREATE INDEX IF NOT EXISTS "judge_invites_contest_id_idx" ON "judge_invites"("contest_id");
CREATE INDEX IF NOT EXISTS "judge_invites_status_idx" ON "judge_invites"("status");

-- Add unique constraint if not exists
DO $$ BEGIN
  ALTER TABLE "judge_invites" ADD CONSTRAINT "judge_invites_contest_id_judge_id_key" UNIQUE ("contest_id", "judge_id");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- AddForeignKey (skip if exists)
DO $$ BEGIN
  ALTER TABLE "judge_invites" ADD CONSTRAINT "judge_invites_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "judge_invites" ADD CONSTRAINT "judge_invites_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
