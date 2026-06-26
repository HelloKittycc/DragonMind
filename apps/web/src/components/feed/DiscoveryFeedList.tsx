import Link from "next/link";
import { attentionLabel, feedCopy } from "@/api-client/display";
import type { DiscoveryFeedItem } from "@/api-client/types";

type Props = {
  items: DiscoveryFeedItem[];
};

export function DiscoveryFeedList({ items }: Props) {
  const highAttention = items.filter((item) => item.runtime_importance >= 70);
  const repeated = items.filter((item) => item.item_type === "repeated_sparks");
  const related = items.filter((item) => item.item_type === "related_sparks" || item.item_type === "relation");
  const pending = items.filter((item) => item.item_type === "pending_spark_follow_up" || item.item_type === "discovery_task");

  return (
    <section className="feed stack">
      {items.length === 0 ? (
        <div className="empty-state">
          <h2>今天暂时没有明显异常</h2>
          <p>你可以先记录一个新想法，DragonMind 会帮你检查它是否与历史内容有关。</p>
          <Link className="button" href="/#quick-capture">
            记录新想法
          </Link>
        </div>
      ) : (
        <>
          <FeedSection title="高关注事项" items={highAttention.length ? highAttention : items.slice(0, 3)} />
          {repeated.length ? <FeedSection title="重复出现" items={repeated} /> : null}
          {related.length ? <FeedSection title="关联增强" items={related} /> : null}
          {pending.length ? <FeedSection title="待展开想法" items={pending} /> : null}
          <FeedSection title="最近记录" items={items.slice(0, 5)} compact />
        </>
      )}
    </section>
  );
}

function FeedSection({ title, items, compact = false }: { title: string; items: DiscoveryFeedItem[]; compact?: boolean }) {
  return (
    <div className="feed-section stack">
      <h2>{title}</h2>
      <div className={compact ? "feed-grid compact-feed" : "feed-grid"}>
        {items.map((item) => (
          <FeedItemCard item={item} key={`${title}-${item.item_type}-${item.task_id ?? item.relation_id ?? item.evidence_id ?? item.node_id}`} />
        ))}
      </div>
    </div>
  );
}

function FeedItemCard({ item }: { item: DiscoveryFeedItem }) {
  const copy = feedCopy(item);
  return (
    <article className="feed-card">
      <div className="feed-card-header">
        <span className="attention-badge">{copy.badge}</span>
        <span className="attention-level">{attentionLabel(item.runtime_importance)}</span>
      </div>
      <h3>{copy.title}</h3>
      <p>{copy.explanation}</p>
      <p className="reason-line">{copy.reason}</p>
      <p className="muted">相关记录：{item.title}</p>
      <div className="card-actions">
        {item.node_id ? (
          <Link className="button" href={`/nodes/${item.node_id}`}>
            {copy.primaryAction}
          </Link>
        ) : null}
        {item.node_id ? (
          <Link className="button-ghost" href={`/nodes/${item.node_id}`}>
            {copy.secondaryAction}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
