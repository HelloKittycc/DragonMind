import Link from "next/link";
import type { RelationRecord } from "@/api-client/types";
import { formatDateTime, relationReason, relationSummary } from "@/api-client/display";

type Props = {
  nodeId: string;
  relations: RelationRecord[];
};

export function RelationPanel({ nodeId, relations }: Props) {
  return (
    <section className="panel stack">
      <div>
        <p className="section-kicker">Related Discoveries</p>
        <h2>相关对象</h2>
      </div>
      {relations.length === 0 ? (
        <div className="empty-state compact-empty">
          <strong>暂时没有发现相关对象</strong>
          <p>当类似 Spark 或相关证据出现时，会在这里显示。</p>
        </div>
      ) : (
        relations.map((relation) => {
          const otherNodeId = relation.source_node_id === nodeId ? relation.target_node_id : relation.source_node_id;
          return (
            <article className="relation-card" key={relation.id}>
              <div>
                <span className="soft-badge">{relationSummary(relation)}</span>
                <h3>{relationReason(relation)}</h3>
                <p className="muted">记录时间：{formatDateTime(relation.created_at)}</p>
              </div>
              <Link className="text-action" href={`/nodes/${otherNodeId}`}>
                打开相关对象
              </Link>
            </article>
          );
        })
      )}
    </section>
  );
}
