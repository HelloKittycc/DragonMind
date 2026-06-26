"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { archiveNode } from "@/api-client/client";

type Props = {
  nodeId: string;
  archived: boolean;
};

export function ArchiveButton({ nodeId, archived }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function onArchive() {
    setError("");
    setIsSaving(true);
    try {
      await archiveNode(nodeId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "归档失败。请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <button className="button button-secondary" disabled={archived || isSaving} onClick={onArchive} type="button">
        {archived ? "已归档" : "归档"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
