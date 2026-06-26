"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSpark } from "@/api-client/client";

export function InputCapture() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [createdNodeId, setCreatedNodeId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const detail = await createSpark(content, title);
      setTitle("");
      setContent("");
      setCreatedNodeId(detail.node.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "记录失败。请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  function reset() {
    setTitle("");
    setContent("");
    setError("");
    setCreatedNodeId("");
    setIsExpanded(false);
  }

  if (!isExpanded) {
    return (
      <section className="quick-capture-compact" id="quick-capture">
        <button className="quick-capture-button" onClick={() => setIsExpanded(true)} type="button">
          记录一个新想法
        </button>
      </section>
    );
  }

  return (
    <form className="quick-capture panel stack" id="quick-capture" onSubmit={onSubmit}>
      <div>
        <label htmlFor="spark-title">标题，可选</label>
        <input
          id="spark-title"
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="可以先不写标题"
        />
      </div>
      <div>
        <label htmlFor="spark-content">想法内容</label>
        <textarea
          id="spark-content"
          className="textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="记录一个观察、担忧、假设或突然冒出来的想法……"
          required
        />
      </div>
      <div className="form-actions">
        <button className="button" disabled={isSaving || !content.trim()} type="submit">
          {isSaving ? "正在保存..." : "保存并观察"}
        </button>
        <button className="button-ghost" onClick={reset} type="button">
          取消
        </button>
      </div>
      {createdNodeId ? (
        <div className="success-note">
          <p>已记录。DragonMind 会检查它是否和历史内容有关。</p>
          <div className="form-actions">
            <button className="button-secondary button" onClick={() => router.push(`/nodes/${createdNodeId}`)} type="button">
              查看详情
            </button>
            <button className="button-ghost" onClick={() => setCreatedNodeId("")} type="button">
              继续记录
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
