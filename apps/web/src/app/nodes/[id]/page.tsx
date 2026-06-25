import Link from "next/link";
import { getNode } from "@/api-client/client";
import { AppendMessageForm } from "@/components/nodes/AppendMessageForm";
import { MessageTimeline } from "@/components/nodes/MessageTimeline";
import { StageProgressionForm } from "@/components/nodes/StageProgressionForm";
import { TaskPanel } from "@/components/tasks/TaskPanel";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NodeDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getNode(id);

  return (
    <main className="shell stack">
      <header className="topbar">
        <div>
          <h1 className="brand">{detail.node.title}</h1>
          <p className="muted">
            {detail.node.node_type} · {detail.node.lifecycle_status}
          </p>
        </div>
        <div className="nav-links">
          <Link href="/workspace">Workspace</Link>
          <Link href="/">New Spark</Link>
        </div>
      </header>
      <MessageTimeline messages={detail.messages} />
      <AppendMessageForm nodeId={detail.node.id} />
      <StageProgressionForm nodeId={detail.node.id} nodeType={detail.node.node_type} />
      <TaskPanel tasks={detail.tasks} />
      <section className="panel">
        <h2>Day 1 Records</h2>
        <p className="muted">
          Interpretation: {detail.latest_interpretation?.extraction_version ?? "none"}
        </p>
        <p className="muted">Tasks: {detail.tasks.length}</p>
        <p className="muted">Relations: {detail.relations.length}</p>
      </section>
    </main>
  );
}
