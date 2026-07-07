CREATE TABLE IF NOT EXISTS review_guiding_question (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES review_session(id) ON DELETE RESTRICT,
  question TEXT NOT NULL,
  rationale TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('suggested', 'dismissed', 'converted')),
  created_node_id TEXT REFERENCES node(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((status = 'converted' AND created_node_id IS NOT NULL) OR (status != 'converted'))
);

CREATE INDEX IF NOT EXISTS idx_review_guiding_question_session_id ON review_guiding_question (session_id);
CREATE INDEX IF NOT EXISTS idx_review_guiding_question_status ON review_guiding_question (status);
CREATE INDEX IF NOT EXISTS idx_review_guiding_question_created_node_id ON review_guiding_question (created_node_id);
