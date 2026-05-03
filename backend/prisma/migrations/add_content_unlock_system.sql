-- Add unlock amount fields to content tables
ALTER TABLE "shorts" ADD COLUMN IF NOT EXISTS "unlock_amount_kr" DECIMAL(18,4);
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "unlock_amount_kr" DECIMAL(18,4);
ALTER TABLE "live_streams" ADD COLUMN IF NOT EXISTS "unlock_amount_kr" DECIMAL(18,4);

-- Create content unlocks tracking table
CREATE TABLE IF NOT EXISTS "content_unlocks" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "content_id" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "amount_kr" DECIMAL(18,4) NOT NULL,
  "amount_fiat" DECIMAL(18,4),
  "currency" VARCHAR(3),
  "creator_id" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "content_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "content_unlocks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create unique index to prevent duplicate unlocks
CREATE UNIQUE INDEX IF NOT EXISTS "content_unlocks_user_content_unique" ON "content_unlocks"("user_id", "content_id", "content_type");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "content_unlocks_user_id_idx" ON "content_unlocks"("user_id");
CREATE INDEX IF NOT EXISTS "content_unlocks_content_idx" ON "content_unlocks"("content_id", "content_type");
CREATE INDEX IF NOT EXISTS "content_unlocks_creator_id_idx" ON "content_unlocks"("creator_id");
