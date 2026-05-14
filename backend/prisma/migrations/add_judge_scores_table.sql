-- Add judge_scores table for contest judging
CREATE TABLE IF NOT EXISTS "judge_scores" (
    "id" TEXT NOT NULL,
    "judge_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "judge_scores_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "judge_scores_judge_id_submission_id_key" ON "judge_scores"("judge_id", "submission_id");

-- Add index on submission_id
CREATE INDEX IF NOT EXISTS "judge_scores_submission_id_idx" ON "judge_scores"("submission_id");

-- Add foreign keys
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "contest_judges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "contest_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add comment
COMMENT ON TABLE "judge_scores" IS 'Stores individual judge scores for contest submissions';
