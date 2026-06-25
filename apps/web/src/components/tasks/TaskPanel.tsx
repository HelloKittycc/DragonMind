import type { TaskRecord } from "@/api-client/types";
import { TaskControls } from "./TaskControls";

type Props = {
  tasks: TaskRecord[];
};

export function TaskPanel({ tasks }: Props) {
  return (
    <section className="panel stack">
      <h2>Tasks</h2>
      {tasks.length === 0 ? (
        <p className="muted">No tasks.</p>
      ) : (
        tasks.map((task) => (
          <article className="task-row" key={task.id}>
            <div>
              <strong>{task.task_type}</strong>
              <p className="muted">
                {task.status} · next {task.next_remind_at ?? "none"}
              </p>
              <p>{task.content}</p>
            </div>
            <TaskControls task={task} />
          </article>
        ))
      )}
    </section>
  );
}
