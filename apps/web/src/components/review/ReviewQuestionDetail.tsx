"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertReviewGuidingQuestion, dismissReviewGuidingQuestion } from "@/api-client/client";
import { formatFullDate } from "@/api-client/display";
import type { ReviewGuidingQuestionRecord, ReviewSessionRecord } from "@/api-client/types";
import { AdvisorDrawer } from "@/components/layout/AdvisorDrawer";
import { BottomCaptureBar } from "@/components/single-focus/BottomCaptureBar";

type Props = {
  session: ReviewSessionRecord;
  question: ReviewGuidingQuestionRecord;
};

function analysisSteps(question: ReviewGuidingQuestionRecord) {
  if (question.question.includes("趋势") || question.question.includes("渠道")) {
    return [
      "先确认变化是否连续超过一个业务周期。",
      "再判断它只发生在某个渠道，还是渠道整体问题。",
      "最后看它是否影响下月预算和销售动作。"
    ];
  }
  if (question.question.includes("优先级") || question.question.includes("计划")) {
    return ["先列出下期计划依赖的证据。", "再标出证据不足或冲突的地方。", "最后决定哪些计划需要最小验证动作。"];
  }
  return ["先把问题和已有材料对齐。", "再拆出最需要验证的原因。", "最后决定是否进入判断链路。"];
}

export function ReviewQuestionDetail({ session, question }: Props) {
  const router = useRouter();
  const [supplement, setSupplement] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  async function onCreateNode() {
    setIsCreating(true);
    setError("");
    try {
      const response = await convertReviewGuidingQuestion(question.id, supplement);
      router.push(`/nodes/${response.node_id}`);
    } catch {
      setError("创建判断失败，请稍后重试。");
    } finally {
      setIsCreating(false);
    }
  }

  async function onDismiss() {
    setIsDismissing(true);
    setError("");
    try {
      if (question.status === "suggested") {
        await dismissReviewGuidingQuestion(question.id);
      }
      router.push(`/review/sessions/${session.id}`);
    } catch {
      setError("暂不展开失败，请稍后重试。");
    } finally {
      setIsDismissing(false);
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

        <section className="review-primary-card review-question-detail">
          <p className="sf-kicker-static">展开这个问题</p>
          <h1>{question.question}</h1>
          <p className="review-muted">来自：{session.title}</p>

          <div className="review-advisor-note">
            <strong>我为什么提出它</strong>
            <p>{question.rationale}</p>
          </div>

          <div className="review-analysis-card">
            <h2>先这样分析</h2>
            <ol>
              {analysisSteps(question).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <label className="review-field-label" htmlFor="review-question-supplement">
            你的补充
          </label>
          <textarea
            className="review-question-textarea"
            id="review-question-supplement"
            onChange={(event) => setSupplement(event.target.value)}
            placeholder="补充你看到的情况，或说明你不同意这个问题……"
            value={supplement}
          />
          <p className="review-boundary-note">只有点击“创建判断”后，才会生成一条可继续展开的判断线索。</p>

          {error ? <p className="sf-error">{error}</p> : null}
          <div className="review-modal-actions">
            <button className="review-secondary-action" disabled={isDismissing} onClick={onDismiss} type="button">
              {isDismissing ? "处理中" : "暂不展开"}
            </button>
            <button
              className="review-primary-action"
              disabled={isCreating || question.status !== "suggested"}
              onClick={onCreateNode}
              type="button"
            >
              {question.status === "converted" ? "已创建判断" : isCreating ? "创建中" : "创建判断"}
            </button>
          </div>

          <Link className="review-back-link" href={`/review/sessions/${session.id}`}>
            回到本月复盘
          </Link>
        </section>
        <BottomCaptureBar />
      </section>
    </main>
  );
}
