-- Add downvotesCount to contest_submissions
ALTER TABLE contest_submissions ADD COLUMN IF NOT EXISTS downvotes_count INTEGER NOT NULL DEFAULT 0;

-- Rename voterId to userId in contest_votes
ALTER TABLE contest_votes RENAME COLUMN voter_id TO user_id;

-- Add voteType to contest_votes
ALTER TABLE contest_votes ADD COLUMN IF NOT EXISTS vote_type VARCHAR(10) NOT NULL DEFAULT 'UPVOTE';

-- Drop old unique constraint
ALTER TABLE contest_votes DROP CONSTRAINT IF EXISTS contest_votes_submission_id_voter_id_key;

-- Add new unique constraint
ALTER TABLE contest_votes ADD CONSTRAINT contest_votes_user_id_submission_id_key UNIQUE (user_id, submission_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS contest_votes_submission_id_idx ON contest_votes(submission_id);
CREATE INDEX IF NOT EXISTS contest_votes_user_id_idx ON contest_votes(user_id);
