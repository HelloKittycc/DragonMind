CREATE TABLE IF NOT EXISTS review_session (
  id TEXT PRIMARY KEY,
  primary_topic_id TEXT NOT NULL REFERENCES topic(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  CHECK (period_start <= period_end),
  CHECK ((status = 'completed' AND completed_at IS NOT NULL) OR (status != 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_review_session_primary_topic_id ON review_session (primary_topic_id);
CREATE INDEX IF NOT EXISTS idx_review_session_status ON review_session (status);
CREATE INDEX IF NOT EXISTS idx_review_session_period ON review_session (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_review_session_created_at ON review_session (created_at);
