import type { EvidenceRecord } from "@/api-client/types";
import { evidenceSummary } from "@/api-client/display";

type Props = {
  evidence: EvidenceRecord[];
};

export function EvidencePanel({ evidence }: Props) {
  return (
    <section className="panel stack cited-evidence-panel">
      <div>
        <p className="section-kicker">已引用</p>
        <h2>已引用依据</h2>
        <p className="muted">这些资料已经被你明确放入当前线索，用来支撑、反驳或补充判断。</p>
      </div>
      {evidence.length === 0 ? (
        <p className="muted">还没有引用依据。可以先从上方外部资料中搜索，再选择要引用的片段。</p>
      ) : (
        evidence.map((item) => (
          <article className="evidence-row" key={item.id}>
            <strong>{evidenceSummary(item)}</strong>
            {item.knowledge_chunk_id ? <span className="soft-badge evidence-source-badge">资料片段</span> : null}
            <p>{item.content}</p>
            {item.source || item.source_url ? (
              <p className="muted">
                来源：{item.source ?? "未注明"} {item.source_url ? item.source_url : ""}
              </p>
            ) : null}
          </article>
        ))
      )}
    </section>
  );
}
