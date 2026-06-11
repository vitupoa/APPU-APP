-- Create user_bookmarks table
-- This table stores user bookmarks for various content types (shorts, posts, etc.)

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT user_bookmarks_unique UNIQUE (user_id, content_id, content_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_content ON user_bookmarks(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_created_at ON user_bookmarks(created_at);

-- Add comment
COMMENT ON TABLE user_bookmarks IS 'Stores user bookmarks for content across the platform';
