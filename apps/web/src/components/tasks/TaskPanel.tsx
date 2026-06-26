import type { TaskRecord } from "@/api-client/types";
import { formatDateTime, taskDescription, taskSummary, taskStatusLabel } from "@/api-client/display";
import { TaskControls } from "./TaskControls";

type Props = {
  tasks: TaskRecord[];
};

export function TaskPanel({ tasks }: Props) {
  return (
    <section className="panel stack">
      <div>
        <p className="section-kicker">Tasks</p>
        <h2>待处理事项</h2>
      </div>
      {tasks.length === 0 ? (
        <p className="muted">当前没有待处理事项。</p>
      ) : (
        tasks.map((task) => (
          <article className="task-row" key={task.id}>
            <div>
              <strong>{taskSummary(task)}</strong>
              <p className="muted">
                {task.status === "pending" && task.next_remind_at
                  ? `下次提醒：${formatDateTime(task.next_remind_at)}`
                  : taskStatusLabel[task.status] ?? task.status}
              </p>
              <p>{taskDescription(task)}</p>
            </div>
            <TaskControls task={task} />
          </article>
        ))
      )}
    </section>
  );
}
