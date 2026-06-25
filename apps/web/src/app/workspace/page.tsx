import Link from "next/link";
import { getWorkspaceNodes } from "@/api-client/client";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

const filters = ["inbox", "active", "decision", "all"];

export default async function WorkspacePage({ searchParams }: Props) {
  const params = await searchParams;
  const selected = filters.includes(params.filter ?? "") ? params.filter! : "inbox";
  const items = await getWorkspaceNodes(selected);

  return (
    <main className="shell stack">
      <header className="topbar">
        <div>
          <h1 className="brand">Workspace</h1>
          <p className="muted">Inbox, Active, Decision, All</p>
        </div>
        <Link href="/">New Spark</Link>
      </header>
      <nav className="filter-row">
        {filters.map((filter) => (
          <Link className={filter === selected ? "filter active-filter" : "filter"} href={`/workspace?filter=${filter}`} key={filter}>
            {filter}
          </Link>
        ))}
      </nav>
      <section className="panel stack">
        {items.length === 0 ? (
          <p className="muted">No nodes in this filter.</p>
        ) : (
          items.map((item) => (
            <article className="workspace-row" key={item.node.id}>
              <div>
                <Link href={`/nodes/${item.node.id}`}>
                  <strong>{item.node.title}</strong>
                </Link>
                <p className="muted">
                  {item.node.node_type} · {item.node.lifecycle_status} · pending tasks {item.pending_tasks.length}
                </p>
                <p>{item.latest_message?.content ?? ""}</p>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
