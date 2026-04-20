-- Baseline migration combining all schema updates

-- ============================================
-- 1. Contest Vote Fields Updates
-- ============================================

-- Add downvotesCount to contest_submissions
ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS downvotes_count INTEGER NOT NULL DEFAULT 0;

-- Rename voterId to userId in contest_votes (skip if already renamed)
DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='contest_votes' AND column_name='voter_id') THEN
    ALTER TABLE contest_votes RENAME COLUMN voter_id TO user_id;
  END IF;
END $$;

-- Add voteType to contest_votes
ALTER TABLE contest_votes ADD COLUMN IF NOT EXISTS vote_type VARCHAR(10) NOT NULL DEFAULT 'UPVOTE';

-- Drop old unique constraint
ALTER TABLE contest_votes DROP CONSTRAINT IF EXISTS contest_votes_submission_id_voter_id_key;

-- Add new unique constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contest_votes_user_id_submission_id_key') THEN
    ALTER TABLE contest_votes ADD CONSTRAINT contest_votes_user_id_submission_id_key UNIQUE (user_id, submission_id);
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS contest_votes_submission_id_idx ON contest_votes(submission_id);
CREATE INDEX IF NOT EXISTS contest_votes_user_id_idx ON contest_votes(user_id);

-- ============================================
-- 2. Feeds and Voting Updates
-- ============================================

-- Rename user_id to creator_id in shorts (skip if already renamed)
DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='shorts' AND column_name='user_id') THEN
    ALTER TABLE shorts RENAME COLUMN user_id TO creator_id;
  END IF;
END $$;

-- Rename music_title and music_artist to music_track in shorts
ALTER TABLE shorts ADD COLUMN IF NOT EXISTS music_track VARCHAR(255);
UPDATE shorts SET music_track = CONCAT(music_title, ' - ', music_artist) WHERE music_title IS NOT NULL AND music_track IS NULL;
ALTER TABLE shorts DROP COLUMN IF EXISTS music_title;
ALTER TABLE shorts DROP COLUMN IF EXISTS music_artist;

-- Rename views to views_count in shorts (skip if already renamed)
DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='shorts' AND column_name='views') THEN
    ALTER TABLE shorts RENAME COLUMN views TO views_count;
  END IF;
END $$;

-- Update indexes
CREATE INDEX IF NOT EXISTS shorts_creator_id_created_at_idx ON shorts(creator_id, created_at);
DROP INDEX IF EXISTS shorts_user_id_created_at_idx;

-- Add admire relation indexes
CREATE INDEX IF NOT EXISTS admires_admirer_id_idx ON admires(admirer_id);
CREATE INDEX IF NOT EXISTS admires_admired_id_idx ON admires(admired_id);

-- ============================================
-- 3. Comments System Updates
-- ============================================

-- Add commentsCount to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0 NOT NULL;

-- Add commentsCount to shorts table
ALTER TABLE shorts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0 NOT NULL;

-- Add commentsCount to contest_submissions table
ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0 NOT NULL;

-- ============================================
-- 4. Team Contests Schema
-- ============================================

-- Add participation_type, team_size, max_teams to contests
ALTER TABLE contests ADD COLUMN IF NOT EXISTS participation_type VARCHAR(20) DEFAULT 'INDIVIDUAL_ONLY';
ALTER TABLE contests ADD COLUMN IF NOT EXISTS team_size INT;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS max_teams INT;

-- Add check constraint for participation_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contests_participation_type_check') THEN
    ALTER TABLE contests ADD CONSTRAINT contests_participation_type_check CHECK (participation_type IN ('INDIVIDUAL_ONLY', 'TEAM_ONLY', 'BOTH'));
  END IF;
END $$;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  avatar_url VARCHAR(500),
  leader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members INT NOT NULL DEFAULT 5,
  total_wins INT DEFAULT 0,
  total_prizes DECIMAL(18, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_name UNIQUE(name)
);

-- Add check constraint for max_members
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_max_members_check') THEN
    ALTER TABLE teams ADD CONSTRAINT teams_max_members_check CHECK (max_members BETWEEN 2 AND 10);
  END IF;
END $$;

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_member UNIQUE(team_id, user_id)
);

-- Add check constraint for role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_role_check') THEN
    ALTER TABLE team_members ADD CONSTRAINT team_members_role_check CHECK (role IN ('LEADER', 'CO_LEADER', 'MEMBER'));
  END IF;
END $$;

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  inviter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_pending_invitation UNIQUE(team_id, invitee_id, status)
);

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_invitations_status_check') THEN
    ALTER TABLE team_invitations ADD CONSTRAINT team_invitations_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'));
  END IF;
END $$;

-- Team contest registrations
CREATE TABLE IF NOT EXISTS team_contest_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_registration UNIQUE(contest_id, team_id)
);

-- Team submissions table
CREATE TABLE IF NOT EXISTS team_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  media_url VARCHAR(500) NOT NULL,
  media_type VARCHAR(10) NOT NULL,
  caption TEXT,
  contributors TEXT[] NOT NULL,
  votes_count INT DEFAULT 0,
  judge_score DECIMAL(5, 2) DEFAULT 0,
  final_score DECIMAL(7, 2),
  rank INT,
  submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_submission UNIQUE(contest_id, team_id)
);

-- Add check constraint for media_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_submissions_media_type_check') THEN
    ALTER TABLE team_submissions ADD CONSTRAINT team_submissions_media_type_check CHECK (media_type IN ('photo', 'video'));
  END IF;
END $$;

-- Team submission votes
CREATE TABLE IF NOT EXISTS team_submission_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES team_submissions(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_vote UNIQUE(submission_id, voter_id)
);

-- Team chat mapping
CREATE TABLE IF NOT EXISTS team_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_chat UNIQUE(team_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee ON team_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id, status);
CREATE INDEX IF NOT EXISTS idx_team_registrations_contest ON team_contest_registrations(contest_id);
CREATE INDEX IF NOT EXISTS idx_team_registrations_team ON team_contest_registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_submissions_contest ON team_submissions(contest_id, votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_team_submission_votes_submission ON team_submission_votes(submission_id);
