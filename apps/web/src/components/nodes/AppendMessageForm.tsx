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
      setError(err instanceof Error ? err.message : "Message append failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <label htmlFor="message-content">Append message</label>
      <textarea
        id="message-content"
        className="textarea"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        required
      />
      <button className="button" disabled={isSaving || !content.trim()} type="submit">
        {isSaving ? "Appending..." : "Append"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
