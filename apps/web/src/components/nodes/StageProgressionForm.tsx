"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { progressNode } from "@/api-client/client";

type Props = {
  nodeId: string;
  nodeType: string;
};

const nextStageByType: Record<string, string> = {
  spark: "Reasoning",
  reasoning: "Decision Prep",
  decision_prep: "Decision"
};

const actionCopy: Record<string, { title: string; description: string; placeholder: string; button: string }> = {
  spark: {
    title: "展开为 Reasoning",
    description: "把这个想法展开成一段推理。",
    placeholder: "写下你的初步推理、关联背景或可能原因……",
    button: "展开为 Reasoning"
  },
  reasoning: {
    title: "生成 Decision Prep",
    description: "把当前推理整理成决策准备材料。",
    placeholder: "整理选项、约束、风险和判断依据……",
    button: "生成 Decision Prep"
  },
  decision_prep: {
    title: "记录 Decision",
    description: "记录你的最终选择。",
    placeholder: "记录最终选择，以及为什么现在做这个决定……",
    button: "记录 Decision"
  }
};

export function StageProgressionForm({ nodeId, nodeType }: Props) {
  const router = useRouter();
  const nextStage = nextStageByType[nodeType];
  const copy = actionCopy[nodeType];
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!nextStage) {
    return (
      <section className="panel stack">
        <h2>查看决策链路</h2>
        <p className="muted">Decision 是当前 v0.1 认知链路终点。</p>
      </section>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const detail = await progressNode(nodeId, content, title);
      router.push(`/nodes/${detail.node.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "推进失败。请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <div>
        <p className="section-kicker">Primary Action</p>
        <h2>{copy.title}</h2>
        <p className="muted">{copy.description}</p>
      </div>
      <input
        className="input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="标题，可选"
      />
      <textarea
        className="textarea"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={copy.placeholder}
        required
      />
      <button className="button" disabled={isSaving || !content.trim()} type="submit">
        {isSaving ? "正在创建..." : copy.button}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
