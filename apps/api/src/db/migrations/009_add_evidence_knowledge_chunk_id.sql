ALTER TABLE evidence ADD COLUMN knowledge_chunk_id TEXT;

CREATE INDEX IF NOT EXISTS idx_evidence_knowledge_chunk_id ON evidence (knowledge_chunk_id);
