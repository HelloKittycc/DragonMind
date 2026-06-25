CREATE TABLE IF NOT EXISTS node_interpretation (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES node(id) ON DELETE RESTRICT,
  entities_json TEXT NOT NULL,
  keywords_json TEXT NOT NULL,
  extraction_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_node_interpretation_node_id ON node_interpretation (node_id);
CREATE INDEX IF NOT EXISTS idx_node_interpretation_node_created_at ON node_interpretation (node_id, created_at);
CREATE INDEX IF NOT EXISTS idx_node_interpretation_extraction_version ON node_interpretation (extraction_version);
