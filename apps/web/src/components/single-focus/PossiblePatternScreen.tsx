"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { appendMessage } from "@/api-client/client";
import type { PossiblePatternDisplayModel } from "@/api-client/single-focus";
import { EvidenceScrollList } from "./EvidenceScrollList";

type Props = {
  model: PossiblePatternDisplayModel;
};

export function PossiblePatternScreen({ model }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function persist(message: string, success: string) {
    setIsSaving(true);
    setStatus("");
    try {
      await appendMessage(model.nodeId, message);
      setStatus(success);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "操作失败。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="sf-primary-card pattern">
      <p className="sf-kicker">认知殿</p>
      <h1>{model.title}</h1>
      <p className="sf-confidence">{model.confidenceSentence}</p>
      <h2 className="sf-section-title pattern">我为什么这么判断</h2>
      <EvidenceScrollList className="pattern" items={model.rationale} />
      <div className="sf-status-card">
        <strong>状态</strong>
        <h2>{model.status}</h2>
        <p>{model.statusExplanation}</p>
      </div>
      <div className="sf-action-row pattern">
        <button className="sf-button primary" disabled={isSaving} onClick={() => setStatus("我会继续观察它是否再次出现。")} type="button">
          继续观察
        </button>
        <button className="sf-button secondary principle" disabled={isSaving} onClick={() => persist(model.confirmMessage, "已写入当前线索。")} type="button">
          确认为产品原则
        </button>
        <button className="sf-button secondary small" disabled={isSaving} onClick={() => persist(model.dismissMessage, "已忽略这个可能模式。")} type="button">
          忽略
        </button>
      </div>
      {status ? <p className="sf-status">{status}</p> : null}
    </section>
  );
}
