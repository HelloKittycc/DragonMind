CREATE TABLE IF NOT EXISTS topic (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'archived')),
  review_cadence TEXT CHECK (review_cadence IS NULL OR review_cadence IN ('monthly', 'quarterly')),
  next_review_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_topic_status ON topic (status);
CREATE INDEX IF NOT EXISTS idx_topic_review_cadence ON topic (review_cadence);
CREATE INDEX IF NOT EXISTS idx_topic_next_review_at ON topic (next_review_at);
CREATE INDEX IF NOT EXISTS idx_topic_created_at ON topic (created_at);
