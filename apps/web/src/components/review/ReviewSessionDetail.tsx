"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addReviewSessionInput,
  createReviewSessionNode,
  generateReviewGuidingQuestions,
  getKnowledgeSources,
  getReviewGuidingQuestions,
  getReviewSessionInputs,
  getWorkspaceNodes,
  removeReviewSessionInput,
  updateReviewSection
} from "@/api-client/client";
import { formatFullDate } from "@/api-client/display";
import type {
  KnowledgeSourceRecord,
  ReviewGuidingQuestionRecord,
  ReviewSectionRecord,
  ReviewSessionDetail as ReviewSessionDetailType,
  ReviewSessionInputRecord,
  WorkspaceNodeItem
} from "@/api-client/types";
import { AdvisorDrawer } from "@/components/layout/AdvisorDrawer";
import { BottomCaptureBar } from "@/components/single-focus/BottomCaptureBar";

type Props = {
  detail: ReviewSessionDetailType;
  initialInputs: ReviewSessionInputRecord[];
  initialQuestions: ReviewGuidingQuestionRecord[];
};

type InputTarget = {
  key: string;
  target_type: "node" | "knowledge_source";
  target_id: string;
  title: string;
  label: string;
  excerpt: string;
};

function formatPeriod(start: string, end: string) {
  return `${start.replaceAll("-", ".")} - ${end.replaceAll("-", ".")}`;
}

function statusText(status: string) {
  if (status === "completed") return "已完成";
  if (status === "draft") return "准备中";
  return "复盘中";
}

function inputSummary(inputs: ReviewSessionInputRecord[]) {
  const knowledgeCount = inputs.filter((item) => item.target_type === "knowledge_source").length;
  const nodeCount = inputs.filter((item) => item.target_type === "node").length;
  return `资料 ${knowledgeCount} 份 · 判断 ${nodeCount} 条 · 只使用你确认纳入的内容`;
}

function sectionPreview(section: ReviewSectionRecord) {
  const content = section.content?.trim();
  if (!content) {
    return "等待你写入目标、偏差或问题点。";
  }
  return content.split("\n").filter(Boolean).slice(0, 2).join(" / ");
}

export function ReviewSessionDetail({ detail, initialInputs, initialQuestions }: Props) {
  const router = useRouter();
  const [sections, setSections] = useState(detail.sections);
  const [inputs, setInputs] = useState(initialInputs);
  const [questions, setQuestions] = useState(initialQuestions);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = useState("");
  const [isInputManagerOpen, setIsInputManagerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualError, setManualError] = useState("");
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const isCompleted = detail.session.status === "completed";

  async function saveSection(sectionId: string) {
    const updated = await updateReviewSection(sectionId, sectionDraft);
    setSections((current) => current.map((item) => (item.id === sectionId ? updated : item)));
    setEditingSectionId(null);
    router.refresh();
  }

  async function refreshInputs() {
    setInputs(await getReviewSessionInputs(detail.session.id));
  }

  async function refreshQuestions() {
    setQuestions(await getReviewGuidingQuestions(detail.session.id));
  }

  async function onGenerateQuestions() {
    setIsGenerating(true);
    setQuestionError("");
    try {
      setQuestions(await generateReviewGuidingQuestions(detail.session.id));
    } catch {
      setQuestionError("暂时无法生成值得分析的问题，请先纳入资料或补充复盘结构。");
    } finally {
      setIsGenerating(false);
    }
  }

  async function onCreateManualQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = manualQuestion.trim();
    if (!question) {
      return;
    }
    setIsCreatingManual(true);
    setManualError("");
    try {
      const response = await createReviewSessionNode(detail.session.id, { question });
      router.push(`/nodes/${response.node_id}`);
    } catch {
      setManualError("创建判断失败，请稍后重试。");
    } finally {
      setIsCreatingManual(false);
    }
  }

  return (
    <main className="sf-page review-page">
      <section className="sf-phone review-phone">
        <header className="sf-header">
          <AdvisorDrawer buttonClassName="sf-brand-mark sf-menu-button" />
          <strong>DragonMind</strong>
          <time>{formatFullDate()}</time>
        </header>

        <section className="review-primary-card review-session-card">
          <p className="sf-kicker-static">本月复盘</p>
          <h1>{detail.session.title}</h1>
          <p className="review-muted">
            业务周期：{formatPeriod(detail.session.period_start, detail.session.period_end)} · {statusText(detail.session.status)}
          </p>

          <div className="review-advisor-note">
            <strong>我的提醒</strong>
            <p>先把目标拆到指标，再把偏差拆到问题点。不要直接写结论。</p>
          </div>

          <div className="review-section-head compact">
            <h2>复盘结构</h2>
            <span>纯文本，可随时保存</span>
          </div>
          <div className="review-structure-scroll">
            {sections.map((section) => (
              <article className="review-structure-row" key={section.id}>
                <div>
                  <strong>{section.title}</strong>
                  {editingSectionId === section.id ? (
                    <textarea
                      className="review-section-textarea"
                      onChange={(event) => setSectionDraft(event.target.value)}
                      value={sectionDraft}
                    />
                  ) : (
                    <p>{sectionPreview(section)}</p>
                  )}
                </div>
                {isCompleted ? null : editingSectionId === section.id ? (
                  <button className="review-mini-action" onClick={() => saveSection(section.id)} type="button">
                    保存
                  </button>
                ) : (
                  <button
                    className="review-mini-action"
                    onClick={() => {
                      setEditingSectionId(section.id);
                      setSectionDraft(section.content ?? "");
                    }}
                    type="button"
                  >
                    编辑
                  </button>
                )}
              </article>
            ))}
          </div>

          <div className="review-input-summary">
            <div>
              <strong>已纳入资料 / 判断</strong>
              <p>{inputSummary(inputs)}</p>
            </div>
            {!isCompleted ? (
              <button className="review-mini-action" onClick={() => setIsInputManagerOpen(true)} type="button">
                管理输入
              </button>
            ) : null}
          </div>

          <div className="review-section-head compact">
            <h2>值得分析的问题</h2>
            {!isCompleted ? (
              <button className="review-mini-action" disabled={isGenerating} onClick={onGenerateQuestions} type="button">
                {isGenerating ? "生成中" : "生成"}
              </button>
            ) : null}
          </div>
          {questionError ? <p className="sf-error">{questionError}</p> : null}
          <div className="review-question-list">
            {questions.length === 0 ? <p className="review-empty">先纳入材料或补充结构，再让 DragonMind 提出值得分析的问题。</p> : null}
            {questions.map((question) => (
              <Link
                className={question.status === "suggested" ? "review-question-card" : "review-question-card muted"}
                href={`/review/sessions/${detail.session.id}/questions/${question.id}`}
                key={question.id}
              >
                <strong>{question.question}</strong>
                <span>{question.rationale}</span>
              </Link>
            ))}
          </div>

          {!isCompleted ? (
            <form className="review-manual-question" onSubmit={onCreateManualQuestion}>
              <label htmlFor="manual-review-question">添加一个想分析的问题</label>
              <textarea
                id="manual-review-question"
                onChange={(event) => setManualQuestion(event.target.value)}
                placeholder="例如：8 月是否应该调整渠道预算？"
                value={manualQuestion}
              />
              {manualError ? <p className="sf-error">{manualError}</p> : null}
              <button className="review-primary-action" disabled={isCreatingManual || !manualQuestion.trim()} type="submit">
                创建判断
              </button>
            </form>
          ) : null}
        </section>
        <BottomCaptureBar />
      </section>

      {isInputManagerOpen ? (
        <ReviewInputManager
          inputs={inputs}
          onClose={() => setIsInputManagerOpen(false)}
          onChanged={async () => {
            await refreshInputs();
            await refreshQuestions();
          }}
          sessionId={detail.session.id}
        />
      ) : null}
    </main>
  );
}

function ReviewInputManager({
  sessionId,
  inputs,
  onChanged,
  onClose
}: {
  sessionId: string;
  inputs: ReviewSessionInputRecord[];
  onChanged: () => Promise<void>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [nodeResults, setNodeResults] = useState<WorkspaceNodeItem[]>([]);
  const [sourceResults, setSourceResults] = useState<KnowledgeSourceRecord[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const includedKeys = useMemo(() => new Set(inputs.map((item) => `${item.target_type}:${item.target_id}`)), [inputs]);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    setError("");
    setIsSearching(true);
    try {
      const [nodes, sources] = await Promise.all([getWorkspaceNodes("all"), getKnowledgeSources()]);
      const normalized = trimmed.toLowerCase();
      setNodeResults(
        nodes
          .filter((item) => !trimmed || item.node.title.toLowerCase().includes(normalized))
          .filter((item) => !includedKeys.has(`node:${item.node.id}`))
          .slice(0, 8)
      );
      setSourceResults(
        sources
          .filter((source) => !trimmed || source.title.toLowerCase().includes(normalized))
          .filter((source) => !includedKeys.has(`knowledge_source:${source.id}`))
          .slice(0, 8)
      );
    } catch {
      setError("搜索失败，请稍后重试。");
    } finally {
      setIsSearching(false);
    }
  }

  function toggleTarget(target: InputTarget) {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(target.key)) {
        next.delete(target.key);
      } else {
        next.add(target.key);
      }
      return next;
    });
  }

  async function onConfirm() {
    setIsSaving(true);
    setError("");
    try {
      for (const key of selectedKeys) {
        const [target_type, target_id] = key.split(":") as ["node" | "knowledge_source", string];
        await addReviewSessionInput(sessionId, { target_type, target_id, source: "user" });
      }
      setSelectedKeys(new Set());
      await onChanged();
      onClose();
    } catch {
      setError("纳入复盘失败，请确认是否已经纳入过。");
    } finally {
      setIsSaving(false);
    }
  }

  async function onRemove(inputId: string) {
    setError("");
    try {
      await removeReviewSessionInput(sessionId, inputId);
      await onChanged();
    } catch {
      setError("移除失败，请稍后重试。");
    }
  }

  const targets: InputTarget[] = [
    ...nodeResults.map((item) => ({
      key: `node:${item.node.id}`,
      target_type: "node" as const,
      target_id: item.node.id,
      title: item.node.title,
      label: "判断",
      excerpt: item.latest_message?.content ?? "已记录的判断线索"
    })),
    ...sourceResults.map((source) => ({
      key: `knowledge_source:${source.id}`,
      target_type: "knowledge_source" as const,
      target_id: source.id,
      title: source.title,
      label: "资料",
      excerpt: source.original_filename ?? "已导入资料"
    }))
  ];

  return (
    <div className="modal-backdrop review-modal-layer" role="dialog" aria-modal="true" aria-label="纳入复盘材料">
      <section className="review-input-modal">
        <p className="sf-kicker-static">纳入复盘材料</p>
        <h2>只纳入你确认选择的内容</h2>
        <p className="review-muted">DragonMind 不会自动扫描全部资料，也不会把资料自动变成证据或结论。</p>

        <div className="review-included-scroll">
          {inputs.length === 0 ? <p className="review-empty">还没有纳入材料。</p> : null}
          {inputs.map((input) => {
            const knownNode = nodeResults.find((item) => item.node.id === input.target_id);
            const knownSource = sourceResults.find((source) => source.id === input.target_id);
            const title = knownNode?.node.title || knownSource?.title || (input.target_type === "node" ? "已纳入判断" : "已纳入资料");
            return (
              <div className="review-included-row" key={input.id}>
                <span>{input.target_type === "node" ? "判断" : "资料"}：{title}</span>
                <button onClick={() => onRemove(input.id)} type="button">
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <form className="review-input-search" onSubmit={onSearch}>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索渠道、转化率、会议纪要……"
            value={query}
          />
          <button disabled={isSearching} type="submit">
            {isSearching ? "搜索中" : "搜索"}
          </button>
        </form>

        <div className="review-search-scroll">
          {targets.length === 0 ? <p className="review-empty">搜索已有判断或资料后，选择要纳入的内容。</p> : null}
          {targets.map((target) => (
            <label className="review-search-row" key={target.key}>
              <input
                checked={selectedKeys.has(target.key)}
                onChange={() => toggleTarget(target)}
                type="checkbox"
              />
              <span>
                <strong>{target.label}：{target.title}</strong>
                <small>{target.excerpt}</small>
              </span>
            </label>
          ))}
        </div>
        {error ? <p className="sf-error">{error}</p> : null}
        <div className="review-modal-actions">
          <button className="review-secondary-action" onClick={onClose} type="button">
            取消
          </button>
          <button className="review-primary-action" disabled={isSaving || selectedKeys.size === 0} onClick={onConfirm} type="button">
            确认纳入
          </button>
        </div>
      </section>
    </div>
  );
}
