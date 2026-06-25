import Link from "next/link";
import type { DiscoveryFeedItem } from "@/api-client/types";

type Props = {
  items: DiscoveryFeedItem[];
};

export function DiscoveryFeedList({ items }: Props) {
  return (
    <section className="panel stack">
      {items.length === 0 ? (
        <p className="muted">No feed items yet.</p>
      ) : (
        items.map((item) => (
          <article className="feed-row" key={`${item.item_type}-${item.task_id ?? item.relation_id ?? item.evidence_id ?? item.node_id}`}>
            <div>
              <strong>{item.title}</strong>
              <p className="muted">
                {item.item_type} · runtime {item.runtime_importance}
              </p>
              <p>{item.description}</p>
            </div>
            {item.node_id ? <Link href={`/nodes/${item.node_id}`}>Open</Link> : null}
          </article>
        ))
      )}
    </section>
  );
}
