CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('node', 'relation')),
  target_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('fact', 'data', 'document', 'experience', 'radius1_result')),
  stance TEXT NOT NULL CHECK (stance IN ('supports', 'contradicts', 'neutral')),
  content TEXT NOT NULL,
  source TEXT,
  source_url TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evidence_target ON evidence (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_evidence_evidence_type ON evidence (evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_stance ON evidence (stance);
CREATE INDEX IF NOT EXISTS idx_evidence_created_at ON evidence (created_at);
