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

export type KnowledgeSourceRecord = {
  id: string;
  source_type: "paste" | "file";
  title: string;
  original_filename: string | null;
  mime_type: string | null;
  storage_path: string;
  content_sha256: string;
  created_at: string;
  updated_at: string;
};

export type KnowledgeChunkRecord = {
  id: string;
  source_id: string;
  chunk_index: number;
  content: string;
  char_start: number | null;
  char_end: number | null;
  token_estimate: number | null;
  created_at: string;
};

export type CreateKnowledgeSourceResponse = {
  source: KnowledgeSourceRecord;
  chunks: KnowledgeChunkRecord[];
  is_duplicate: boolean;
  duplicate_of_source_id: string | null;
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

export type TopicRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  review_cadence: string | null;
  next_review_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewSectionRecord = {
  id: string;
  session_id: string;
  section_type: string;
  title: string;
  content: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ReviewSessionRecord = {
  id: string;
  primary_topic_id: string;
  title: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type ReviewSessionDetail = {
  session: ReviewSessionRecord;
  sections: ReviewSectionRecord[];
};

export type TopicLinkRecord = {
  id: string;
  topic_id: string;
  target_type: "node" | "knowledge_source";
  target_id: string;
  created_at: string;
};

export type ReviewSessionInputRecord = {
  id: string;
  session_id: string;
  target_type: "node" | "knowledge_source";
  target_id: string;
  source: "user" | "agent_suggestion";
  confirmed_at: string;
  created_at: string;
};

export type ReviewGuidingQuestionRecord = {
  id: string;
  session_id: string;
  question: string;
  rationale: string;
  status: "suggested" | "dismissed" | "converted";
  created_node_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ConvertedGuidingQuestionResponse = {
  guiding_question: ReviewGuidingQuestionRecord;
  node_id: string;
  review_session_input: ReviewSessionInputRecord;
  topic_link: TopicLinkRecord;
};

export type ReviewSessionNodeResponse = {
  node_id: string;
  review_session_input: ReviewSessionInputRecord;
  topic_link: TopicLinkRecord;
};
