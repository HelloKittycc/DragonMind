import type {
  CreateKnowledgeSourceResponse,
  DiscoveryFeedItem,
  EvidenceRecord,
  KnowledgeChunkSearchResult,
  MessageRecord,
  NodeDetail,
  NodeRecord,
  RelationRecord,
  TaskRecord,
  WorkspaceNodeItem
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    let detailMessage = "";
    try {
      detailMessage = String((JSON.parse(text) as { detail?: unknown }).detail ?? "");
    } catch {
      detailMessage = "";
    }
    throw new Error(detailMessage || text || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function createSpark(content: string, title?: string): Promise<NodeDetail> {
  return request<NodeDetail>("/nodes/spark", {
    method: "POST",
    body: JSON.stringify({ content, title: title || undefined })
  });
}

export function getNode(nodeId: string): Promise<NodeDetail> {
  return request<NodeDetail>(`/nodes/${nodeId}`, {
    cache: "no-store"
  });
}

export function appendMessage(nodeId: string, content: string): Promise<MessageRecord> {
  return request<MessageRecord>(`/nodes/${nodeId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, role: "user", message_type: "reply" })
  });
}

export function progressNode(nodeId: string, content: string, title?: string): Promise<NodeDetail> {
  return request<NodeDetail>(`/nodes/${nodeId}/progress`, {
    method: "POST",
    body: JSON.stringify({ content, title: title || undefined })
  });
}

export function getWorkspaceNodes(filter: string): Promise<WorkspaceNodeItem[]> {
  return request<WorkspaceNodeItem[]>(`/nodes?filter=${encodeURIComponent(filter)}`, {
    cache: "no-store"
  });
}

export function createRelation(payload: {
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
  relation_reason: string;
  status?: string;
  created_by?: string;
}): Promise<RelationRecord> {
  return request<RelationRecord>("/relations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateRelationStatus(relationId: string, status: "confirmed" | "dismissed"): Promise<RelationRecord> {
  return request<RelationRecord>(`/relations/${relationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function createTask(payload: {
  node_id: string;
  task_type: string;
  source_type: string;
  content: string;
  next_remind_at?: string;
}): Promise<TaskRecord> {
  return request<TaskRecord>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTaskStatus(taskId: string, status: "pending" | "sleeping" | "completed"): Promise<TaskRecord> {
  return request<TaskRecord>(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function updateTaskReminder(taskId: string, next_remind_at: string): Promise<TaskRecord> {
  return request<TaskRecord>(`/tasks/${taskId}/reminder`, {
    method: "PATCH",
    body: JSON.stringify({ next_remind_at })
  });
}

export function runReminderCadence(): Promise<TaskRecord[]> {
  return request<TaskRecord[]>("/tasks/reminder/run", {
    method: "POST"
  });
}

export function archiveNode(nodeId: string): Promise<NodeRecord> {
  return request<NodeRecord>(`/nodes/${nodeId}/archive`, {
    method: "PATCH"
  });
}

export function getDiscoveryFeed(): Promise<DiscoveryFeedItem[]> {
  return request<DiscoveryFeedItem[]>("/discovery-feed", {
    cache: "no-store"
  });
}

export function createEvidence(payload: {
  target_type: string;
  target_id: string;
  evidence_type: string;
  stance: string;
  content: string;
  source?: string;
  source_url?: string;
}): Promise<EvidenceRecord> {
  return request<EvidenceRecord>("/evidence", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getEvidence(targetType: string, targetId: string): Promise<EvidenceRecord[]> {
  return request<EvidenceRecord[]>(`/evidence?target_type=${encodeURIComponent(targetType)}&target_id=${encodeURIComponent(targetId)}`, {
    cache: "no-store"
  });
}

export function searchKnowledgeChunks(query: string, limit = 10): Promise<KnowledgeChunkSearchResult[]> {
  return request<KnowledgeChunkSearchResult[]>(
    `/knowledge-chunks/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(String(limit))}`,
    {
      cache: "no-store"
    }
  );
}

export function createKnowledgeSourceFromText(payload: {
  title?: string;
  content: string;
}): Promise<CreateKnowledgeSourceResponse> {
  return request<CreateKnowledgeSourceResponse>("/knowledge-sources/text", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function uploadKnowledgeSourceFile(file: File, title?: string): Promise<CreateKnowledgeSourceResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (title?.trim()) {
    formData.append("title", title.trim());
  }
  return request<CreateKnowledgeSourceResponse>("/knowledge-sources/file", {
    method: "POST",
    body: formData
  });
}

export function createEvidenceFromKnowledgeChunk(
  chunkId: string,
  payload: {
    target_type: "node" | "relation";
    target_id: string;
    evidence_type: string;
    stance: "supports" | "contradicts" | "neutral";
    content_override?: string;
  }
): Promise<EvidenceRecord> {
  return request<EvidenceRecord>(`/knowledge-chunks/${chunkId}/evidence`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
