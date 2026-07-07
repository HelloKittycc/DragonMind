CREATE TABLE IF NOT EXISTS review_session_input (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES review_session(id) ON DELETE RESTRICT,
  target_type TEXT NOT NULL CHECK (target_type IN ('node', 'knowledge_source')),
  target_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('user', 'agent_suggestion')),
  confirmed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (session_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_review_session_input_session_id ON review_session_input (session_id);
CREATE INDEX IF NOT EXISTS idx_review_session_input_target ON review_session_input (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_review_session_input_source ON review_session_input (source);
