import type { EvidenceRecord } from "@/api-client/types";
import { evidenceSummary } from "@/api-client/display";

type Props = {
  evidence: EvidenceRecord[];
};

export function EvidencePanel({ evidence }: Props) {
  return (
    <section className="panel stack">
      <div>
        <p className="section-kicker">Evidence</p>
        <h2>证据与资料</h2>
      </div>
      {evidence.length === 0 ? (
        <p className="muted">暂时没有证据或资料。</p>
      ) : (
        evidence.map((item) => (
          <article className="evidence-row" key={item.id}>
            <strong>{evidenceSummary(item)}</strong>
            {item.knowledge_chunk_id ? <span className="soft-badge evidence-source-badge">来自资料库</span> : null}
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
