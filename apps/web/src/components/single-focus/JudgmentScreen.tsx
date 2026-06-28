"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { appendMessage, createTask } from "@/api-client/client";
import type { JudgmentDisplayModel } from "@/api-client/single-focus";
import { EvidenceScrollList } from "./EvidenceScrollList";
import { AcceptSuggestionModal } from "./AcceptSuggestionModal";

type Props = {
  model: JudgmentDisplayModel;
};

export function JudgmentScreen({ model }: Props) {
  const router = useRouter();
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function persistMessage(message: string) {
    setIsSaving(true);
    setStatus("");
    try {
      await appendMessage(model.nodeId, message);
      setStatus("已写入当前线索。");
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "操作失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function scheduleReview() {
    setIsSaving(true);
    setStatus("");
    try {
      await createTask({
        node_id: model.nodeId,
        task_type: "review",
        source_type: "manual",
        content: "稍后复盘这次判断。"
      });
      setStatus("已放入稍后复盘。");
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "暂时无法创建复盘任务。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="sf-primary-card judge">
        <p className="sf-kicker">决策屋</p>
        <h1>{model.question}</h1>
        <div className="sf-current-card">
          <strong>当前建议</strong>
          <p>{model.recommendation}</p>
        </div>
        <h2 className="sf-section-title">理由</h2>
        <EvidenceScrollList className="judge" items={model.reasons} />
        <div className="sf-recommendation-card judge">
          <strong>最小下一步</strong>
          <p>{model.minimumNextStep}</p>
        </div>
        <div className="sf-action-row judge">
          <button className="sf-button primary" disabled={isSaving} onClick={() => setIsAcceptOpen(true)} type="button">
            接受建议
          </button>
          <button className="sf-button secondary" disabled={isSaving} onClick={() => persistMessage(model.disagreeMessage)} type="button">
            我不同意
          </button>
          <button className="sf-button secondary" disabled={isSaving} onClick={scheduleReview} type="button">
            稍后复盘
          </button>
        </div>
        {status ? <p className="sf-status">{status}</p> : null}
      </section>
      <AcceptSuggestionModal
        isOpen={isAcceptOpen}
        isSaving={isSaving}
        onCancel={() => setIsAcceptOpen(false)}
        onConfirm={async () => {
          await persistMessage(model.acceptedMessage);
          setIsAcceptOpen(false);
        }}
      />
    </>
  );
}
