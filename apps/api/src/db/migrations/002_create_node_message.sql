CREATE TABLE IF NOT EXISTS node_message (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES node(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (
    message_type IN (
      'original',
      'reply',
      'reasoning',
      'decision_prep',
      'decision',
      'correction',
      'edit',
      'command_result'
    )
  ),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_node_message_node_id ON node_message (node_id);
CREATE INDEX IF NOT EXISTS idx_node_message_node_created_at ON node_message (node_id, created_at);
