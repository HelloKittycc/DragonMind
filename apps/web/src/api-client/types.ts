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

export type NodeDetail = {
  node: NodeRecord;
  messages: MessageRecord[];
  latest_interpretation: InterpretationRecord | null;
  tasks: TaskRecord[];
  relations: RelationRecord[];
};

export type WorkspaceNodeItem = {
  node: NodeRecord;
  latest_message: MessageRecord | null;
  pending_tasks: TaskRecord[];
};
