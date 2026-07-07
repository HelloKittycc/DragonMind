CREATE TABLE IF NOT EXISTS review_section (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES review_session(id) ON DELETE RESTRICT,
  section_type TEXT NOT NULL CHECK (
    section_type IN (
      'current_goal',
      'actual_result',
      'key_deviation',
      'anomaly_signal',
      'core_question',
      'next_plan',
      'open_issue'
    )
  ),
  title TEXT NOT NULL,
  content TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (session_id, section_type),
  UNIQUE (session_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_review_section_session_id ON review_section (session_id);
CREATE INDEX IF NOT EXISTS idx_review_section_session_order ON review_section (session_id, sort_order);
