"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSpark } from "@/api-client/client";

export function InputCapture() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const detail = await createSpark(content, title);
      setTitle("");
      setContent("");
      router.push(`/nodes/${detail.node.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Spark creation failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <div>
        <label htmlFor="spark-title">Title</label>
        <input
          id="spark-title"
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional"
        />
      </div>
      <div>
        <label htmlFor="spark-content">Spark</label>
        <textarea
          id="spark-content"
          className="textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Capture a thought before analyzing it."
          required
        />
      </div>
      <button className="button" disabled={isSaving || !content.trim()} type="submit">
        {isSaving ? "Saving..." : "Create Spark"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
