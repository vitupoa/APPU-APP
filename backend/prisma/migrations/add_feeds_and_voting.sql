-- Add downvotes_count to contest_submissions
ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS downvotes_count INTEGER DEFAULT 0 NOT NULL;

-- Add vote_type to contest_votes
ALTER TABLE contest_votes ADD COLUMN IF NOT EXISTS vote_type VARCHAR(10) NOT NULL DEFAULT 'UPVOTE';

-- Rename voter_id to user_id in contest_votes
ALTER TABLE contest_votes RENAME COLUMN voter_id TO user_id;

-- Update contest_votes unique constraint
ALTER TABLE contest_votes DROP CONSTRAINT IF EXISTS contest_votes_submission_id_voter_id_key;
ALTER TABLE contest_votes ADD CONSTRAINT contest_votes_user_id_submission_id_key UNIQUE (user_id, submission_id);

-- Add indexes to contest_votes
CREATE INDEX IF NOT EXISTS contest_votes_submission_id_idx ON contest_votes(submission_id);
CREATE INDEX IF NOT EXISTS contest_votes_user_id_idx ON contest_votes(user_id);

-- Rename user_id to creator_id in shorts
ALTER TABLE shorts RENAME COLUMN user_id TO creator_id;

-- Rename music_title and music_artist to music_track in shorts
ALTER TABLE shorts ADD COLUMN IF NOT EXISTS music_track VARCHAR(255);
UPDATE shorts SET music_track = CONCAT(music_title, ' - ', music_artist) WHERE music_title IS NOT NULL;
ALTER TABLE shorts DROP COLUMN IF EXISTS music_title;
ALTER TABLE shorts DROP COLUMN IF EXISTS music_artist;

-- Rename views to views_count in shorts
ALTER TABLE shorts RENAME COLUMN views TO views_count;

-- Create generic likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, content_id, content_type)
);

CREATE INDEX IF NOT EXISTS likes_content_id_content_type_idx ON likes(content_id, content_type);

-- Create generic views table
CREATE TABLE IF NOT EXISTS views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS views_content_id_content_type_idx ON views(content_id, content_type);
CREATE INDEX IF NOT EXISTS views_user_id_created_at_idx ON views(user_id, created_at);

-- Migrate existing short_likes to generic likes table
INSERT INTO likes (user_id, content_id, content_type, created_at)
SELECT user_id, short_id, 'SHORT', created_at
FROM short_likes
ON CONFLICT (user_id, content_id, content_type) DO NOTHING;

-- Migrate existing post_likes to generic likes table
INSERT INTO likes (user_id, content_id, content_type, created_at)
SELECT user_id, post_id, 'POST', created_at
FROM post_likes
ON CONFLICT (user_id, content_id, content_type) DO NOTHING;

-- Update indexes
CREATE INDEX IF NOT EXISTS shorts_creator_id_created_at_idx ON shorts(creator_id, created_at);
DROP INDEX IF EXISTS shorts_user_id_created_at_idx;

-- Add admire relation index
CREATE INDEX IF NOT EXISTS admires_admirer_id_idx ON admires(admirer_id);
CREATE INDEX IF NOT EXISTS admires_admired_id_idx ON admires(admired_id);
