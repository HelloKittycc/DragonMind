CREATE TABLE IF NOT EXISTS topic_link (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topic(id) ON DELETE RESTRICT,
  target_type TEXT NOT NULL CHECK (target_type IN ('node', 'knowledge_source')),
  target_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (topic_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_topic_link_topic_id ON topic_link (topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_link_target ON topic_link (target_type, target_id);
