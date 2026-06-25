"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { progressNode } from "@/api-client/client";

type Props = {
  nodeId: string;
  nodeType: string;
};

const nextStageByType: Record<string, string> = {
  spark: "reasoning",
  reasoning: "decision_prep",
  decision_prep: "decision"
};

export function StageProgressionForm({ nodeId, nodeType }: Props) {
  const router = useRouter();
  const nextStage = nextStageByType[nodeType];
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!nextStage) {
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const detail = await progressNode(nodeId, content, title);
      router.push(`/nodes/${detail.node.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stage progression failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <h2>Progress to {nextStage}</h2>
      <input
        className="input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Optional title"
      />
      <textarea
        className="textarea"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={`Write the ${nextStage} content.`}
        required
      />
      <button className="button" disabled={isSaving || !content.trim()} type="submit">
        {isSaving ? "Creating..." : `Create ${nextStage}`}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
