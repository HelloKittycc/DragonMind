CREATE TABLE IF NOT EXISTS node (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL CHECK (node_type IN ('spark', 'reasoning', 'decision_prep', 'decision')),
  title TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('open', 'closed', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_node_node_type ON node (node_type);
CREATE INDEX IF NOT EXISTS idx_node_lifecycle_status ON node (lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_node_created_at ON node (created_at);
CREATE INDEX IF NOT EXISTS idx_node_archived_at ON node (archived_at);
