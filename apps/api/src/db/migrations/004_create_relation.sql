CREATE TABLE IF NOT EXISTS relation (
  id TEXT PRIMARY KEY,
  source_node_id TEXT NOT NULL REFERENCES node(id) ON DELETE RESTRICT,
  target_node_id TEXT NOT NULL REFERENCES node(id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('derived_from', 'related', 'supports', 'contradicts')),
  relation_reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('suggested', 'confirmed', 'dismissed')),
  created_by TEXT NOT NULL CHECK (created_by IN ('user', 'agent', 'system')),
  created_at TEXT NOT NULL,
  CHECK (source_node_id != target_node_id)
);

CREATE INDEX IF NOT EXISTS idx_relation_source_node_id ON relation (source_node_id);
CREATE INDEX IF NOT EXISTS idx_relation_target_node_id ON relation (target_node_id);
CREATE INDEX IF NOT EXISTS idx_relation_relation_type ON relation (relation_type);
CREATE INDEX IF NOT EXISTS idx_relation_status ON relation (status);
CREATE INDEX IF NOT EXISTS idx_relation_pair_type ON relation (source_node_id, target_node_id, relation_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_relation_active_unique
ON relation (source_node_id, target_node_id, relation_type)
WHERE status IN ('suggested', 'confirmed');
