"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSpark } from "@/api-client/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SparkCaptureModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const detail = await createSpark(content, title);
      setContent("");
      setTitle("");
      onClose();
      router.push(`/nodes/${detail.node.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="sf-modal-overlay" role="dialog" aria-modal="true" aria-label="记录灵光一闪">
      <form className="sf-capture-modal" onSubmit={onSubmit}>
        <p className="sf-modal-label">灵光一闪</p>
        <h2>把一个念头交给 DragonMind</h2>
        <input className="sf-input" onChange={(event) => setTitle(event.target.value)} placeholder="标题，可选" value={title} />
        <textarea
          className="sf-textarea"
          onChange={(event) => setContent(event.target.value)}
          placeholder="写下一个观察、担忧、假设或突然冒出来的想法。"
          required
          value={content}
        />
        <div className="sf-modal-actions">
          <button className="sf-button secondary" onClick={onClose} type="button">
            取消
          </button>
          <button className="sf-button primary" disabled={isSaving || !content.trim()} type="submit">
            {isSaving ? "保存中" : "保存"}
          </button>
        </div>
        {error ? <p className="sf-error">{error}</p> : null}
      </form>
    </div>
  );
}
