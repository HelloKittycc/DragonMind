"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTaskReminder, updateTaskStatus } from "@/api-client/client";
import type { TaskRecord } from "@/api-client/types";

type Props = {
  task: TaskRecord;
};

function tomorrowIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export function TaskControls({ task }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setError("");
    setIsSaving(true);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败。请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="task-actions">
      <button
        className="button button-secondary"
        disabled={isSaving || task.status === "completed"}
        onClick={() => run(() => updateTaskStatus(task.id, "completed"))}
        type="button"
      >
        完成
      </button>
      <button
        className="button button-secondary"
        disabled={isSaving || task.status !== "pending"}
        onClick={() => run(() => updateTaskReminder(task.id, tomorrowIso()))}
        type="button"
      >
        延后
      </button>
      <button
        className="button button-secondary"
        disabled={isSaving || task.status === "completed"}
        onClick={() => run(() => task.status === "sleeping" ? updateTaskStatus(task.id, "pending") : updateTaskStatus(task.id, "sleeping"))}
        type="button"
      >
        {task.status === "sleeping" ? "重新激活" : "休眠"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
