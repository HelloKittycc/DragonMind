import type { EvidenceRecord } from "@/api-client/types";

type Props = {
  evidence: EvidenceRecord[];
};

export function EvidencePanel({ evidence }: Props) {
  return (
    <section className="panel stack">
      <h2>Evidence</h2>
      {evidence.length === 0 ? (
        <p className="muted">No evidence.</p>
      ) : (
        evidence.map((item) => (
          <article className="evidence-row" key={item.id}>
            <strong>{item.stance}</strong>
            <p className="muted">{item.evidence_type}</p>
            <p>{item.content}</p>
          </article>
        ))
      )}
    </section>
  );
}
