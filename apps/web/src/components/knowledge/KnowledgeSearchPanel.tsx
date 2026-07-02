"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEvidenceFromKnowledgeChunk,
  createKnowledgeSourceFromText,
  searchKnowledgeChunks,
  uploadKnowledgeSourceFile
} from "@/api-client/client";
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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  function readableImportError(error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("unsupported knowledge file type")) {
      return "这类文件暂时不能读取。请上传 .txt、.md、.csv 或 .json。";
    }
    if (message.includes("uploaded file exceeds max size")) {
      return "文件超过 5 MB，请拆分后再上传。";
    }
    if (message.includes("knowledge file must be UTF-8 text")) {
      return "文件需要是 UTF-8 文本格式。";
    }
    if (message.includes("pasted text exceeds max size")) {
      return "粘贴内容超过 200 KB，请拆分后再导入。";
    }
    if (message.includes("knowledge content is empty")) {
      return "资料内容不能为空。";
    }
    return "资料补充失败，请稍后重试。";
  }

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
      setSuccessMessage("已引用到当前线索。");
      router.refresh();
    } catch {
      setAttachError("挂为证据失败，请稍后重试。");
    } finally {
      setIsAttaching(false);
    }
  }

  async function onPasteImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsImporting(true);
    setImportError("");
    setImportSuccess("");
    try {
      const response = await createKnowledgeSourceFromText({
        title: pasteTitle.trim() || undefined,
        content: pasteContent
      });
      setPasteTitle("");
      setPasteContent("");
      setImportSuccess(
        response.is_duplicate ? "已补充资料。这段内容之前出现过，可以继续搜索并引用。" : "已补充资料，可以搜索并引用。"
      );
    } catch (error) {
      setImportError(readableImportError(error));
    } finally {
      setIsImporting(false);
    }
  }

  async function onFileImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setImportError("请先选择一个文本文件。");
      return;
    }
    setIsImporting(true);
    setImportError("");
    setImportSuccess("");
    try {
      const response = await uploadKnowledgeSourceFile(selectedFile, fileTitle.trim() || undefined);
      setFileTitle("");
      setSelectedFile(null);
      setImportSuccess(
        response.is_duplicate ? "已补充资料。这份内容之前出现过，可以继续搜索并引用。" : "已补充资料，可以搜索并引用。"
      );
    } catch (error) {
      setImportError(readableImportError(error));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="panel stack knowledge-panel">
      <div className="knowledge-panel-header">
        <div>
          <p className="section-kicker">依据</p>
          <h2>外部依据</h2>
          <p className="muted">为这条线索寻找可以支撑、反驳或补充的资料片段。</p>
        </div>
        <button
          className="button button-secondary"
          onClick={() => {
            setIsImportOpen(true);
            setImportError("");
            setImportSuccess("");
          }}
          type="button"
        >
          补充资料
        </button>
      </div>

      <div className="knowledge-source-card">
        <div>
          <strong>先补充资料，再选择引用</strong>
          <p>DragonMind 不会自动把资料变成结论。只有你确认后，片段才会进入下方依据区。</p>
        </div>
      </div>

      <form className="knowledge-search-form" onSubmit={onSearch}>
        <input
          aria-label="搜索资料关键词"
          className="knowledge-search-input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索可以引用的资料片段……"
          type="search"
          value={query}
        />
        <button className="button button-secondary" disabled={isSearching} type="submit">
          {isSearching ? "搜索中" : "搜索"}
        </button>
      </form>

      {searchError ? <p className="error">{searchError}</p> : null}
      {successMessage ? <p className="success-inline">{successMessage}</p> : null}

      {!query.trim() ? <p className="muted">输入关键词，寻找能帮助判断当前线索的资料。</p> : null}
      {query.trim() && hasSearched && !isSearching && results.length === 0 && !searchError ? (
        <p className="muted">没有找到匹配资料。你可以先补充一段外部资料。</p>
      ) : null}

      {results.length > 0 ? (
        <div className="knowledge-result-list">
          {results.map((chunk) => (
            <article className="knowledge-result" key={chunk.id}>
              <div>
                <span className="knowledge-result-tag">可引用依据</span>
                <strong>{chunk.source_title}</strong>
                <p>{chunk.snippet || chunk.content}</p>
                <p className="muted">命中片段 {chunk.chunk_index + 1} · 同一资料可能出现多个片段</p>
              </div>
              <button className="text-action" onClick={() => openAttachModal(chunk)} type="button">
                引用为依据
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {selectedChunk ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="引用这段资料">
          <div className="knowledge-modal panel stack">
            <div>
              <p className="section-kicker">引用依据</p>
              <h2>引用这段资料</h2>
              <strong className="knowledge-modal-source">{selectedChunk.source_title}</strong>
              <p className="knowledge-excerpt">{selectedChunk.snippet || selectedChunk.content}</p>
              <p className="muted">确认后，这段资料会写入当前线索的“已引用依据”。</p>
            </div>

            <label className="field-label" htmlFor="knowledge-stance">
              这段资料如何作用于当前线索
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
              可选引用摘要
            </label>
            <textarea
              className="knowledge-textarea"
              id="knowledge-override"
              onChange={(event) => setContentOverride(event.target.value)}
              placeholder="可选：保留为空则直接引用原资料片段。"
              value={contentOverride}
            />

            {attachError ? <p className="error">{attachError}</p> : null}
            <div className="modal-actions">
              <button className="button-ghost" disabled={isAttaching} onClick={() => setSelectedChunk(null)} type="button">
                取消
              </button>
              <button className="button button-secondary" disabled={isAttaching} onClick={onAttach} type="button">
                {isAttaching ? "引用中" : "确认引用"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isImportOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="补充外部资料">
          <div className="knowledge-modal panel stack">
            <div>
              <p className="section-kicker">外部资料</p>
              <h2>补充外部资料</h2>
              <p className="muted">资料会先进入本地资料库。你仍需要搜索并手动引用，才会成为当前线索的依据。</p>
            </div>

            <form className="knowledge-import-card" onSubmit={onPasteImport}>
              <div>
                <h3>粘贴一段资料</h3>
                <p className="muted">适合会议纪要、背景说明或短文本材料。</p>
              </div>
              <label className="field-label" htmlFor="knowledge-paste-title">
                标题
              </label>
              <input
                className="knowledge-search-input"
                id="knowledge-paste-title"
                onChange={(event) => setPasteTitle(event.target.value)}
                placeholder="例如：渠道会议纪要"
                value={pasteTitle}
              />
              <label className="field-label" htmlFor="knowledge-paste-content">
                内容
              </label>
              <textarea
                className="knowledge-textarea"
                id="knowledge-paste-content"
                onChange={(event) => setPasteContent(event.target.value)}
                placeholder="粘贴资料正文……"
                value={pasteContent}
              />
              <button className="button button-secondary" disabled={isImporting || !pasteContent.trim()} type="submit">
                {isImporting ? "补充中" : "补充资料"}
              </button>
            </form>

            <form className="knowledge-import-card" onSubmit={onFileImport}>
              <div>
                <h3>上传文本文件</h3>
                <p className="muted">支持 .txt、.md、.csv、.json，最大 5 MB。</p>
              </div>
              <label className="field-label" htmlFor="knowledge-file-title">
                标题（可选）
              </label>
              <input
                className="knowledge-search-input"
                id="knowledge-file-title"
                onChange={(event) => setFileTitle(event.target.value)}
                placeholder="不填则使用文件名"
                value={fileTitle}
              />
              <label className="field-label" htmlFor="knowledge-file">
                文件
              </label>
              <input
                accept=".txt,.md,.csv,.json"
                className="knowledge-file-input"
                id="knowledge-file"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <button className="button button-secondary" disabled={isImporting || !selectedFile} type="submit">
                {isImporting ? "上传中" : "上传并补充"}
              </button>
            </form>

            {importError ? <p className="error">{importError}</p> : null}
            {importSuccess ? <p className="success-inline">{importSuccess}</p> : null}
            <div className="modal-actions">
              <button className="button-ghost" disabled={isImporting} onClick={() => setIsImportOpen(false)} type="button">
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
