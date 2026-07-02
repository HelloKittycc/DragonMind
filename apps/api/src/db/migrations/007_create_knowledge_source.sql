CREATE TABLE IF NOT EXISTS knowledge_source (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('paste', 'file')),
  title TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_source_source_type ON knowledge_source (source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_source_created_at ON knowledge_source (created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_source_content_sha256 ON knowledge_source (content_sha256);
