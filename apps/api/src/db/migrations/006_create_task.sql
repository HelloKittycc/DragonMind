CREATE TABLE IF NOT EXISTS task (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES node(id) ON DELETE RESTRICT,
  task_type TEXT NOT NULL CHECK (task_type IN ('spark_follow_up', 'discovery_expand', 'verify', 'review', 'manual')),
  source_type TEXT NOT NULL CHECK (source_type IN ('spark', 'discovery', 'user', 'system')),
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sleeping', 'completed')),
  remind_count INTEGER NOT NULL DEFAULT 0,
  last_remind_at TEXT,
  next_remind_at TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_node_id ON task (node_id);
CREATE INDEX IF NOT EXISTS idx_task_status ON task (status);
CREATE INDEX IF NOT EXISTS idx_task_next_remind_at ON task (next_remind_at);
CREATE INDEX IF NOT EXISTS idx_task_task_type ON task (task_type);
CREATE INDEX IF NOT EXISTS idx_task_source_type ON task (source_type);
CREATE INDEX IF NOT EXISTS idx_task_archived_at ON task (archived_at);
