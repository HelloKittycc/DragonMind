export type NodeRecord = {
  id: string;
  node_type: string;
  title: string;
  lifecycle_status: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type MessageRecord = {
  id: string;
  node_id: string;
  role: string;
  content: string;
  message_type: string;
  created_at: string;
};

export type InterpretationRecord = {
  id: string;
  node_id: string;
  entities_json: string;
  keywords_json: string;
  extraction_version: string;
  created_at: string;
};

export type TaskRecord = {
  id: string;
  node_id: string;
  task_type: string;
  source_type: string;
  content: string;
  status: string;
  remind_count: number;
  last_remind_at: string | null;
  next_remind_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RelationRecord = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
  relation_reason: string;
  status: string;
  created_by: string;
  created_at: string;
};

export type EvidenceRecord = {
  id: string;
  target_type: string;
  target_id: string;
  evidence_type: string;
  stance: string;
  content: string;
  source: string | null;
  source_url: string | null;
  knowledge_chunk_id: string | null;
  created_at: string;
};

export type KnowledgeChunkSearchResult = {
  id: string;
  source_id: string;
  source_title: string;
  chunk_index: number;
  content: string;
  snippet: string;
  char_start: number | null;
  char_end: number | null;
  token_estimate: number | null;
  created_at: string;
};

export type NodeDetail = {
  node: NodeRecord;
  messages: MessageRecord[];
  latest_interpretation: InterpretationRecord | null;
  tasks: TaskRecord[];
  relations: RelationRecord[];
  evidence: EvidenceRecord[];
};

export type WorkspaceNodeItem = {
  node: NodeRecord;
  latest_message: MessageRecord | null;
  pending_tasks: TaskRecord[];
};

export type DiscoveryFeedItem = {
  item_type: string;
  node_id: string | null;
  task_id: string | null;
  relation_id: string | null;
  evidence_id: string | null;
  title: string;
  description: string;
  created_at: string;
  runtime_importance: number;
};
