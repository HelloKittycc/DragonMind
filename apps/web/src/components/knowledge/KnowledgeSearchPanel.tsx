"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createEvidenceFromKnowledgeChunk, searchKnowledgeChunks } from "@/api-client/client";
import type { KnowledgeChunkSearchResult } from "@/api-client/types";

type Props = {
  nodeId: string;
};

type Stance = "supports" | "contradicts" | "neutral";

const stanceOptions: Array<{ value: Stance; label: string }> = [
  { value: "supports", label: "支持" },
  { value: "contradicts", label: "反驳" },
  { value: "neutral", label: "中性记录" }
];

export function KnowledgeSearchPanel({ nodeId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeChunkSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedChunk, setSelectedChunk] = useState<KnowledgeChunkSearchResult | null>(null);
  const [stance, setStance] = useState<Stance>("supports");
  const [contentOverride, setContentOverride] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachError, setAttachError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    setSuccessMessage("");
    setAttachError("");
    if (!trimmed) {
      setHasSearched(false);
      setResults([]);
      setSearchError("");
      return;
    }

    setHasSearched(true);
    setIsSearching(true);
    setSearchError("");
    try {
      setResults(await searchKnowledgeChunks(trimmed, 10));
    } catch {
      setResults([]);
      setSearchError("资料搜索失败，请稍后重试。");
    } finally {
      setIsSearching(false);
    }
  }

  function openAttachModal(chunk: KnowledgeChunkSearchResult) {
    setSelectedChunk(chunk);
    setStance("supports");
    setContentOverride("");
    setAttachError("");
    setSuccessMessage("");
  }

  async function onAttach() {
    if (!selectedChunk) {
      return;
    }
    setIsAttaching(true);
    setAttachError("");
    try {
      await createEvidenceFromKnowledgeChunk(selectedChunk.id, {
        target_type: "node",
        target_id: nodeId,
        evidence_type: "document",
        stance,
        content_override: contentOverride.trim() || undefined
      });
      setSelectedChunk(null);
      setSuccessMessage("已挂为证据。");
      router.refresh();
    } catch {
      setAttachError("挂为证据失败，请稍后重试。");
    } finally {
      setIsAttaching(false);
    }
  }

  return (
    <section className="panel stack knowledge-panel">
      <div>
        <p className="section-kicker">Knowledge</p>
        <h2>资料搜索</h2>
        <p className="muted">搜索已导入的资料，并把相关片段挂为证据。</p>
      </div>

      <form className="knowledge-search-form" onSubmit={onSearch}>
        <input
          aria-label="搜索资料关键词"
          className="knowledge-search-input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索资料关键词……"
          type="search"
          value={query}
        />
        <button className="button button-secondary" disabled={isSearching} type="submit">
          {isSearching ? "搜索中" : "搜索"}
        </button>
      </form>

      {searchError ? <p className="error">{searchError}</p> : null}
      {successMessage ? <p className="success-inline">{successMessage}</p> : null}

      {!query.trim() ? <p className="muted">输入关键词搜索已导入资料。</p> : null}
      {query.trim() && hasSearched && !isSearching && results.length === 0 && !searchError ? (
        <p className="muted">没有找到匹配资料。你可以先导入一段资料。</p>
      ) : null}

      {results.length > 0 ? (
        <div className="knowledge-result-list">
          {results.map((chunk) => (
            <article className="knowledge-result" key={chunk.id}>
              <div>
                <strong>{chunk.source_title}</strong>
                <p>{chunk.snippet || chunk.content}</p>
                <p className="muted">片段 {chunk.chunk_index + 1}</p>
              </div>
              <button className="text-action" onClick={() => openAttachModal(chunk)} type="button">
                挂为证据
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {selectedChunk ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="挂为证据">
          <div className="knowledge-modal panel stack">
            <div>
              <p className="section-kicker">挂为证据</p>
              <h2>{selectedChunk.source_title}</h2>
              <p className="knowledge-excerpt">{selectedChunk.snippet || selectedChunk.content}</p>
              <p className="muted">目标：当前 Node</p>
            </div>

            <label className="field-label" htmlFor="knowledge-stance">
              证据立场
            </label>
            <select
              className="knowledge-search-input"
              id="knowledge-stance"
              onChange={(event) => setStance(event.target.value as Stance)}
              value={stance}
            >
              {stanceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="field-label" htmlFor="knowledge-override">
              可选摘录
            </label>
            <textarea
              className="knowledge-textarea"
              id="knowledge-override"
              onChange={(event) => setContentOverride(event.target.value)}
              placeholder="可选：保留为空则使用原资料片段。"
              value={contentOverride}
            />

            {attachError ? <p className="error">{attachError}</p> : null}
            <div className="modal-actions">
              <button className="button-ghost" disabled={isAttaching} onClick={() => setSelectedChunk(null)} type="button">
                取消
              </button>
              <button className="button button-secondary" disabled={isAttaching} onClick={onAttach} type="button">
                {isAttaching ? "提交中" : "确认挂为证据"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
