-- Add category field to live_streams table
ALTER TABLE "live_streams" ADD COLUMN "category" VARCHAR(50) DEFAULT 'Chat';

-- Create index for category filtering
CREATE INDEX "live_streams_category_idx" ON "live_streams"("category");

-- Update existing records with inferred categories based on title
UPDATE "live_streams" SET "category" = 'Gaming' WHERE LOWER("title") LIKE '%game%' OR LOWER("title") LIKE '%gaming%' OR LOWER("title") LIKE '%play%';
UPDATE "live_streams" SET "category" = 'Music' WHERE LOWER("title") LIKE '%music%' OR LOWER("title") LIKE '%sing%' OR LOWER("title") LIKE '%song%';
UPDATE "live_streams" SET "category" = 'Sports' WHERE LOWER("title") LIKE '%sport%' OR LOWER("title") LIKE '%fitness%' OR LOWER("title") LIKE '%workout%';
UPDATE "live_streams" SET "category" = 'Art' WHERE LOWER("title") LIKE '%art%' OR LOWER("title") LIKE '%draw%' OR LOWER("title") LIKE '%paint%';
UPDATE "live_streams" SET "category" = 'Cooking' WHERE LOWER("title") LIKE '%cook%' OR LOWER("title") LIKE '%recipe%' OR LOWER("title") LIKE '%food%';
UPDATE "live_streams" SET "category" = 'Tech' WHERE LOWER("title") LIKE '%tech%' OR LOWER("title") LIKE '%code%' OR LOWER("title") LIKE '%programming%';
