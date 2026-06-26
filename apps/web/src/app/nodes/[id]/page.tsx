import Link from "next/link";
import { getNode } from "@/api-client/client";
import { formatDateTime, nodeSummary } from "@/api-client/display";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ArchiveButton } from "@/components/nodes/ArchiveButton";
import { AppendMessageForm } from "@/components/nodes/AppendMessageForm";
import { MessageTimeline } from "@/components/nodes/MessageTimeline";
import { RelationPanel } from "@/components/nodes/RelationPanel";
import { StageProgressionForm } from "@/components/nodes/StageProgressionForm";
import { TaskPanel } from "@/components/tasks/TaskPanel";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NodeDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getNode(id);

  return (
    <AppShell>
      <main className="shell stack">
        <PageHeader
          title={detail.node.title}
          subtitle={`${nodeSummary(detail.node)} · 创建于 ${formatDateTime(detail.node.created_at)}`}
          eyebrow="认知对象详情"
          actions={
            <>
              <Link className="text-action" href="/">
                Agent观察日报
              </Link>
              <Link className="text-action" href="/workspace">
                Workspace
              </Link>
            </>
          }
        />
        <StageProgressionForm nodeId={detail.node.id} nodeType={detail.node.node_type} />
        <MessageTimeline messages={detail.messages} />
        <AppendMessageForm nodeId={detail.node.id} />
        <RelationPanel nodeId={detail.node.id} relations={detail.relations} />
        <TaskPanel tasks={detail.tasks} />
        <EvidencePanel evidence={detail.evidence} />
        <section className="panel danger-zone">
          <div>
            <p className="section-kicker">Archive</p>
            <h2>归档区域</h2>
            <p className="muted">归档不会删除历史，只会让它默认从 Workspace 中隐藏。</p>
          </div>
          <ArchiveButton nodeId={detail.node.id} archived={detail.node.lifecycle_status === "archived"} />
        </section>
      </main>
    </AppShell>
  );
}
