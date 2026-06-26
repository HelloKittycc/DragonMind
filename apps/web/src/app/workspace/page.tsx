import Link from "next/link";
import { getWorkspaceNodes } from "@/api-client/client";
import { formatDateTime, nodeSummary } from "@/api-client/display";
import { AppShell, PageHeader } from "@/components/layout/AppShell";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

const filters = ["inbox", "active", "decision", "all"];
const filterLabels: Record<string, string> = {
  inbox: "Inbox 待处理",
  active: "Active 进行中",
  decision: "Decision 决策",
  all: "All 全部"
};

export default async function WorkspacePage({ searchParams }: Props) {
  const params = await searchParams;
  const selected = filters.includes(params.filter ?? "") ? params.filter! : "inbox";
  const items = await getWorkspaceNodes(selected);

  return (
    <AppShell>
      <main className="shell workspace-shell stack">
        <PageHeader
          title="Workspace"
          subtitle="一个更安静的工作区，用来扫读认知对象、任务和决策链路。"
          actions={
            <>
              <Link className="text-action" href="/">
                Agent观察日报
              </Link>
              <Link className="button" href="/#quick-capture">
                记录新想法
              </Link>
            </>
          }
        />
        <nav className="filter-row" aria-label="Workspace filters">
          {filters.map((filter) => (
            <Link className={filter === selected ? "filter active-filter" : "filter"} href={`/workspace?filter=${filter}`} key={filter}>
              {filterLabels[filter]}
            </Link>
          ))}
        </nav>
        <section className="list-summary">
          <strong>{items.length}</strong>
          <span>{filterLabels[selected]} 中的认知对象</span>
        </section>
        <section className="workspace-list stack">
          {items.length === 0 ? (
            <div className="empty-state">
              <h2>这里还没有内容</h2>
              <p>记录 Spark 后，它会出现在这里。</p>
              <Link className="button" href="/#quick-capture">
                记录 Spark
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <article className="workspace-card" key={item.node.id}>
                <div className="workspace-card-main">
                  <div className="badge-row">
                    <span className="soft-badge">{nodeSummary(item.node)}</span>
                    {item.pending_tasks.length ? <span className="attention-badge">待处理 {item.pending_tasks.length}</span> : null}
                  </div>
                  <Link className="card-title-link" href={`/nodes/${item.node.id}`}>
                    {item.node.title}
                  </Link>
                  <p>{item.latest_message?.content ?? "暂无补充记录。"}</p>
                  <p className="muted">最近更新：{formatDateTime(item.node.updated_at)}</p>
                </div>
                <div className="card-actions">
                  <Link className="button" href={`/nodes/${item.node.id}`}>
                    打开
                  </Link>
                  <Link className="button-ghost" href={`/nodes/${item.node.id}`}>
                    展开分析
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </AppShell>
  );
}
