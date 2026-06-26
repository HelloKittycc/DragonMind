"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { appendMessage } from "@/api-client/client";

type Props = {
  nodeId: string;
};

export function AppendMessageForm({ nodeId }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await appendMessage(nodeId, content);
      setContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败。请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <label htmlFor="message-content">补充记录</label>
      <textarea
        id="message-content"
        className="textarea"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="补充新的观察、修正或背景信息……"
        required
      />
      <button className="button" disabled={isSaving || !content.trim()} type="submit">
        {isSaving ? "正在保存..." : "保存补充"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
