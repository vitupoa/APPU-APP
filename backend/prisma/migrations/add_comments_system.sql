-- Comments tables already exist from Prisma schema
-- Just add the comments_count columns to content tables

-- Add commentsCount to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0 NOT NULL;

-- Add commentsCount to shorts table
ALTER TABLE shorts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0 NOT NULL;

-- Add commentsCount to contest_submissions table
ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0 NOT NULL;
