CREATE TABLE IF NOT EXISTS knowledge_chunk (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES knowledge_source(id),
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL,
  char_start INTEGER,
  char_end INTEGER,
  token_estimate INTEGER,
  created_at TEXT NOT NULL,
  UNIQUE (source_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunk_source_id ON knowledge_chunk (source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunk_source_order ON knowledge_chunk (source_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunk_created_at ON knowledge_chunk (created_at);
