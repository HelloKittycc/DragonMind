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
import { BottomCaptureBar } from "@/components/single-focus/BottomCaptureBar";

type Props = {
  nodes: WorkspaceNodeItem[];
};

type Stance = "supports" | "contradicts" | "neutral";

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
  const [stance] = useState<Stance>("neutral");
  const [isCiting, setIsCiting] = useState(false);
  const [citeError, setCiteError] = useState("");
  const [citationSuccessTitle, setCitationSuccessTitle] = useState("");

  async function onSourceImport(event: FormEvent<HTMLFormElement>) {
    if (selectedFile) {
      await onFileUpload(event);
      return;
    }
    await onPasteImport(event);
  }

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
      setCitationSuccessTitle(selectedChunk.source_title);
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

        <section className="knowledge-d-primary-card">
          <p className="sf-kicker-static">资料与证据</p>
          <h1>把判断需要的资料放进来</h1>
          <p className="knowledge-d-intro">DragonMind 不会替你下结论，只会把资料片段整理成可引用的依据。</p>

          <form className="knowledge-d-source-card" onSubmit={onSourceImport}>
            <input
              accept={fileAccept}
              hidden
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              ref={fileInputRef}
              type="file"
            />
            <textarea
              className={selectedFile ? "knowledge-d-source-input selected" : "knowledge-d-source-input"}
              onChange={(event) => setPasteContent(event.target.value)}
              placeholder="粘贴会议纪要，或上传 PDF、Word、PPT、Excel 等资料。"
              readOnly={Boolean(selectedFile)}
              value={selectedFile ? `已选择：${selectedFile.name}` : pasteContent}
            />
            {!selectedFile ? (
              <button className="knowledge-d-file-button" onClick={() => fileInputRef.current?.click()} type="button">
                选择文件
              </button>
            ) : (
              <button className="knowledge-d-file-button" onClick={() => fileInputRef.current?.click()} type="button">
                重新选择
              </button>
            )}
            <button className="knowledge-d-primary compact" disabled={isImporting || (!selectedFile && !pasteContent.trim())} type="submit">
              {isImporting ? "上传中" : "上传"}
            </button>
          </form>

          <div className="knowledge-d-search-label">查找依据</div>
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

          {searchError ? <p className="sf-error">{searchError}</p> : null}
          <div className="knowledge-d-results">
            {!query.trim() ? <p className="knowledge-d-helper">输入关键词搜索已导入资料。</p> : null}
            {query.trim() && hasSearched && !isSearching && results.length === 0 && !searchError ? (
              <p className="knowledge-d-helper">没有找到匹配资料。你可以先导入一段资料。</p>
            ) : null}
            {results.length > 0
              ? results.map((chunk) => (
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
              ))
              : null}
          </div>

          <div className="knowledge-d-target-card">
            <label className="knowledge-d-target-label" htmlFor="knowledge-target-node">
              引用到当前线索
            </label>
            <select
              className="knowledge-d-target-select"
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
          </div>
        </section>
        <BottomCaptureBar />
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
              <strong className="knowledge-modal-source">结果状态：将把“{selectedChunk.source_title}”引用到当前线索。</strong>
              <p className="knowledge-excerpt">{selectedChunk.snippet || selectedChunk.content}</p>
              <p className="muted">确认后，这段资料会用于支持、反驳或补充当前判断。点击取消则不引用。</p>
            </div>
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

      {citationSuccessTitle ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="引用成功">
          <div className="knowledge-modal panel stack">
            <div>
              <p className="section-kicker">引用成功</p>
              <h2>已引用到当前线索</h2>
              <p className="muted">“{citationSuccessTitle}”已经出现在所选线索的证据中。它不会自动变成结论，只会作为判断依据被保留。</p>
            </div>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={() => setCitationSuccessTitle("")} type="button">
                知道了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
