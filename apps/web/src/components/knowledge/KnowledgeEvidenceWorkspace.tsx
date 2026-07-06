"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEvidenceFromKnowledgeChunk,
  createKnowledgeSourceFromText,
  searchKnowledgeChunks,
  uploadKnowledgeSourceFile
} from "@/api-client/client";
import { formatFullDate } from "@/api-client/display";
import type { KnowledgeChunkSearchResult, WorkspaceNodeItem } from "@/api-client/types";
import { AdvisorDrawer } from "@/components/layout/AdvisorDrawer";

type Props = {
  nodes: WorkspaceNodeItem[];
};

type Stance = "supports" | "contradicts" | "neutral";

const stanceOptions: Array<{ value: Stance; label: string }> = [
  { value: "supports", label: "支持" },
  { value: "contradicts", label: "反驳" },
  { value: "neutral", label: "中性记录" }
];

const fileAccept = ".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md,.json";

function humanError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("unsupported") || message.includes("not supported")) {
    return "这类文件暂时不能读取。请上传 PDF、Word、PPT、Excel、CSV、TXT、MD 或 JSON。";
  }
  if (message.includes("exceeds") || message.includes("too large")) {
    return "文件超过上传上限，请拆分后再上传。";
  }
  if (message.includes("OCR") || message.includes("扫描")) {
    return "当前文件可能是扫描版 PDF，暂不支持 OCR。";
  }
  if (message.includes("empty")) {
    return "资料内容为空，换一个文件或先粘贴关键内容。";
  }
  return "可能是文件过大、格式暂不支持，或内容无法读取。你可以换一个文件，或者先粘贴关键内容。";
}

function sourceTag(chunk: KnowledgeChunkSearchResult) {
  const title = chunk.source_title.toLowerCase();
  if (title.includes(".pdf")) return "PDF";
  if (title.includes(".docx") || title.includes("word")) return "Word";
  if (title.includes(".pptx") || title.includes("ppt")) return "PPT";
  if (title.includes(".xlsx") || title.includes("excel")) return "Excel";
  if (title.includes(".csv")) return "CSV";
  if (title.includes(".md")) return "MD";
  if (title.includes(".json")) return "JSON";
  if (title.includes(".txt")) return "TXT";
  return "资料片段";
}

export function KnowledgeEvidenceWorkspace({ nodes }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [statusModal, setStatusModal] = useState<"success" | "failure" | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeChunkSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedChunk, setSelectedChunk] = useState<KnowledgeChunkSearchResult | null>(null);
  const [targetNodeId, setTargetNodeId] = useState(nodes[0]?.node.id ?? "");
  const [stance, setStance] = useState<Stance>("neutral");
  const [isCiting, setIsCiting] = useState(false);
  const [citeError, setCiteError] = useState("");

  async function onPasteImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsImporting(true);
    setStatusMessage("");
    try {
      const response = await createKnowledgeSourceFromText({
        title: pasteTitle.trim() || undefined,
        content: pasteContent
      });
      setPasteTitle("");
      setPasteContent("");
      setStatusMessage(
        response.is_duplicate ? "资料已导入。这段内容之前出现过，DragonMind 仍保留了这次导入。" : ""
      );
      setStatusModal("success");
      router.refresh();
    } catch (error) {
      setStatusMessage(humanError(error));
      setStatusModal("failure");
    } finally {
      setIsImporting(false);
    }
  }

  async function onFileUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      fileInputRef.current?.click();
      return;
    }
    setIsImporting(true);
    setStatusMessage("");
    try {
      const response = await uploadKnowledgeSourceFile(selectedFile, fileTitle.trim() || undefined);
      setSelectedFile(null);
      setFileTitle("");
      setStatusMessage(response.is_duplicate ? "资料已导入。这份内容之前出现过，DragonMind 仍保留了这次导入。" : "");
      setStatusModal("success");
      router.refresh();
    } catch (error) {
      setStatusMessage(humanError(error));
      setStatusModal("failure");
    } finally {
      setIsImporting(false);
    }
  }

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setSearchError("");
      return;
    }
    setHasSearched(true);
    setIsSearching(true);
    setSearchError("");
    try {
      setResults(await searchKnowledgeChunks(trimmed, 12));
    } catch {
      setResults([]);
      setSearchError("资料搜索失败，请稍后重试。");
    } finally {
      setIsSearching(false);
    }
  }

  async function onConfirmCitation() {
    if (!selectedChunk || !targetNodeId) {
      return;
    }
    setIsCiting(true);
    setCiteError("");
    try {
      await createEvidenceFromKnowledgeChunk(selectedChunk.id, {
        target_type: "node",
        target_id: targetNodeId,
        evidence_type: "document",
        stance
      });
      setSelectedChunk(null);
      router.refresh();
    } catch {
      setCiteError("引用失败，请稍后重试。");
    } finally {
      setIsCiting(false);
    }
  }

  return (
    <main className="sf-page knowledge-page">
      <section className="sf-phone knowledge-phone">
        <header className="sf-header">
          <AdvisorDrawer buttonClassName="sf-brand-mark sf-menu-button" />
          <strong>DragonMind</strong>
          <time>{formatFullDate()}</time>
        </header>

        <section className="knowledge-hero-card">
          <p className="sf-kicker-static">资料与证据</p>
          <h1>把判断需要的资料放进来</h1>
          <p>DragonMind 不会替你下结论，只会把资料片段整理成可引用的依据。</p>
        </section>

        <section className="knowledge-d-card">
          <div className="knowledge-d-section-title">
            <strong>补充资料</strong>
            <span>粘贴会议纪要，或上传 PDF、Word、PPT、Excel 等资料。</span>
          </div>

          <form className="knowledge-d-paste" onSubmit={onPasteImport}>
            <input
              className="knowledge-d-input"
              onChange={(event) => setPasteTitle(event.target.value)}
              placeholder="资料标题，例如：渠道会议纪要"
              value={pasteTitle}
            />
            <textarea
              className="knowledge-d-textarea"
              onChange={(event) => setPasteContent(event.target.value)}
              placeholder="粘贴会议纪要、复盘材料或背景资料……"
              value={pasteContent}
            />
            <button className="knowledge-d-primary" disabled={isImporting || !pasteContent.trim()} type="submit">
              {isImporting ? "导入中" : "导入资料"}
            </button>
          </form>

          <form className="knowledge-d-file" onSubmit={onFileUpload}>
            <input
              className="knowledge-d-input"
              onChange={(event) => setFileTitle(event.target.value)}
              placeholder="文件标题，可选"
              value={fileTitle}
            />
            <input
              accept={fileAccept}
              hidden
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              ref={fileInputRef}
              type="file"
            />
            {!selectedFile ? (
              <button className="knowledge-d-file-button" onClick={() => fileInputRef.current?.click()} type="button">
                + 选择本地文件
              </button>
            ) : (
              <div className="knowledge-d-selected-file">
                <span>已选择：{selectedFile.name}</span>
                <div>
                  <button className="knowledge-d-ghost" onClick={() => fileInputRef.current?.click()} type="button">
                    重新选择
                  </button>
                  <button className="knowledge-d-primary" disabled={isImporting} type="submit">
                    {isImporting ? "上传中" : "上传资料"}
                  </button>
                </div>
              </div>
            )}
            <p className="knowledge-d-helper">支持 PDF、Word、PPT、Excel、文本文件。</p>
          </form>
        </section>

        <section className="knowledge-d-card">
          <div className="knowledge-d-section-title">
            <strong>查找依据</strong>
            <span>搜索后选择片段，再引用到某条线索。</span>
          </div>
          <form className="knowledge-d-search" onSubmit={onSearch}>
            <input
              className="knowledge-d-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索渠道、转化率、会议纪要……"
              type="search"
              value={query}
            />
            <button className="knowledge-d-ghost" disabled={isSearching} type="submit">
              {isSearching ? "搜索中" : "搜索"}
            </button>
          </form>
          <label className="knowledge-d-target-label" htmlFor="knowledge-target-node">
            引用到当前线索
          </label>
          <select
            className="knowledge-d-input"
            id="knowledge-target-node"
            onChange={(event) => setTargetNodeId(event.target.value)}
            value={targetNodeId}
          >
            {nodes.length === 0 ? <option value="">暂无可引用线索</option> : null}
            {nodes.map((item) => (
              <option key={item.node.id} value={item.node.id}>
                {item.node.title}
              </option>
            ))}
          </select>

          {searchError ? <p className="sf-error">{searchError}</p> : null}
          {!query.trim() ? <p className="knowledge-d-helper">输入关键词搜索已导入资料。</p> : null}
          {query.trim() && hasSearched && !isSearching && results.length === 0 && !searchError ? (
            <p className="knowledge-d-helper">没有找到匹配资料。你可以先导入一段资料。</p>
          ) : null}

          {results.length > 0 ? (
            <div className="knowledge-d-results">
              {results.map((chunk) => (
                <article className="knowledge-d-result" key={chunk.id}>
                  <div>
                    <span>{sourceTag(chunk)}</span>
                    <strong>{chunk.source_title}</strong>
                  </div>
                  <p>{chunk.snippet || chunk.content}</p>
                  <small>第 {chunk.chunk_index + 1} 段</small>
                  <button className="knowledge-d-quote" onClick={() => setSelectedChunk(chunk)} type="button">
                    引用
                  </button>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </section>

      {statusModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={statusModal === "success" ? "上传成功" : "上传失败"}>
          <div className="knowledge-modal panel stack">
            <div>
              <p className="section-kicker">{statusModal === "success" ? "完成" : "未完成"}</p>
              <h2>{statusModal === "success" ? "上传成功" : "上传失败"}</h2>
              <p className="muted">
                {statusModal === "success"
                  ? "资料已导入。DragonMind 已把它整理成可搜索、可引用的片段。"
                  : statusMessage ||
                    "可能是文件过大、格式暂不支持，或内容无法读取。你可以换一个文件，或者先粘贴关键内容。"}
              </p>
              {statusModal === "success" && statusMessage ? <p className="muted">{statusMessage}</p> : null}
            </div>
            <div className="modal-actions">
              {statusModal === "failure" ? (
                <button className="button-ghost" onClick={() => setStatusModal(null)} type="button">
                  取消
                </button>
              ) : null}
              <button
                className="button button-secondary"
                onClick={() => {
                  if (statusModal === "failure") {
                    fileInputRef.current?.click();
                  }
                  setStatusModal(null);
                }}
                type="button"
              >
                {statusModal === "success" ? "知道了" : "重新选择"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedChunk ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="确认引用这条依据">
          <div className="knowledge-modal panel stack">
            <div>
              <p className="section-kicker">引用依据</p>
              <h2>确认引用这条依据？</h2>
              <strong className="knowledge-modal-source">{selectedChunk.source_title}</strong>
              <p className="knowledge-excerpt">{selectedChunk.snippet || selectedChunk.content}</p>
              <p className="muted">引用后，这段资料会出现在所选线索的“证据”中。它不会自动变成结论，只会作为判断依据被保留。</p>
            </div>
            <label className="field-label" htmlFor="knowledge-page-stance">
              这段依据的作用
            </label>
            <select
              className="knowledge-search-input"
              id="knowledge-page-stance"
              onChange={(event) => setStance(event.target.value as Stance)}
              value={stance}
            >
              {stanceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {citeError ? <p className="error">{citeError}</p> : null}
            <div className="modal-actions">
              <button className="button-ghost" disabled={isCiting} onClick={() => setSelectedChunk(null)} type="button">
                取消
              </button>
              <button className="button button-secondary" disabled={isCiting || !targetNodeId} onClick={onConfirmCitation} type="button">
                {isCiting ? "引用中" : "确认引用"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
