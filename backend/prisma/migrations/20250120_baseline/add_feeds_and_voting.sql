-- Note: downvotes_count, vote_type, user_id rename, and indexes already added by add_contest_vote_fields.sql

-- Rename user_id to creator_id in shorts
ALTER TABLE shorts RENAME COLUMN user_id TO creator_id;

-- Rename music_title and music_artist to music_track in shorts
ALTER TABLE shorts ADD COLUMN IF NOT EXISTS music_track VARCHAR(255);
UPDATE shorts SET music_track = CONCAT(music_title, ' - ', music_artist) WHERE music_title IS NOT NULL;
ALTER TABLE shorts DROP COLUMN IF EXISTS music_title;
ALTER TABLE shorts DROP COLUMN IF EXISTS music_artist;

-- Rename views to views_count in shorts
ALTER TABLE shorts RENAME COLUMN views TO views_count;

-- Note: likes and views tables already exist, skip creation and migration

-- Update indexes
CREATE INDEX IF NOT EXISTS shorts_creator_id_created_at_idx ON shorts(creator_id, created_at);
DROP INDEX IF EXISTS shorts_user_id_created_at_idx;

-- Add admire relation index
CREATE INDEX IF NOT EXISTS admires_admirer_id_idx ON admires(admirer_id);
CREATE INDEX IF NOT EXISTS admires_admired_id_idx ON admires(admired_id);
