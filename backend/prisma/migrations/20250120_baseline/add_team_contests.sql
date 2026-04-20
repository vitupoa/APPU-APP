-- Team Contests Database Schema

-- Add participation_type, team_size, max_teams to contests
ALTER TABLE contests ADD COLUMN IF NOT EXISTS participation_type VARCHAR(20) DEFAULT 'INDIVIDUAL_ONLY' CHECK (participation_type IN ('INDIVIDUAL_ONLY', 'TEAM_ONLY', 'BOTH'));
ALTER TABLE contests ADD COLUMN IF NOT EXISTS team_size INT;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS max_teams INT;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  avatar_url VARCHAR(500),
  leader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members INT NOT NULL DEFAULT 5 CHECK (max_members BETWEEN 2 AND 10),
  total_wins INT DEFAULT 0,
  total_prizes DECIMAL(18, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_name UNIQUE(name)
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('LEADER', 'CO_LEADER', 'MEMBER')),
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_member UNIQUE(team_id, user_id)
);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  inviter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_pending_invitation UNIQUE(team_id, invitee_id, status)
);

-- Remove team_contests table (using main contests table instead)
-- Team contests are just regular contests with participation_type = 'TEAM_ONLY' or 'BOTH'

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
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('photo', 'video')),
  caption TEXT,
  contributors TEXT[] NOT NULL,
  votes_count INT DEFAULT 0,
  judge_score DECIMAL(5, 2) DEFAULT 0,
  final_score DECIMAL(7, 2),
  rank INT,
  submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_submission UNIQUE(contest_id, team_id)
);

-- Team submission votes
CREATE TABLE IF NOT EXISTS team_submission_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES team_submissions(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_vote UNIQUE(submission_id, voter_id)
);

-- Team chat mapping (links to main chat feature)
CREATE TABLE IF NOT EXISTS team_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL, -- References main chat system
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_chat UNIQUE(team_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee ON team_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id, status);
CREATE INDEX IF NOT EXISTS idx_team_contests_status ON team_contests(status, deadline);
CREATE INDEX IF NOT EXISTS idx_team_registrations_contest ON team_contest_registrations(contest_id);
CREATE INDEX IF NOT EXISTS idx_team_registrations_team ON team_contest_registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_submissions_contest ON team_submissions(contest_id, votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_team_submission_votes_submission ON team_submission_votes(submission_id);
