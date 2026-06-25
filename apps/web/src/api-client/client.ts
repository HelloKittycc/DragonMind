import type { MessageRecord, NodeDetail } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
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
