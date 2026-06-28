"use client";

import type { SourceDisplayItem } from "@/api-client/single-focus";

type Props = {
  source: SourceDisplayItem | null;
  onClose: () => void;
};

export function SourceModal({ source, onClose }: Props) {
  if (!source) {
    return null;
  }
  return (
    <div className="sf-modal-overlay" role="dialog" aria-modal="true" aria-label="来源记录">
      <div className="sf-source-modal">
        <p className="sf-modal-label">来源记录</p>
        <h2>{source.source_title}</h2>
        <p>{source.source_excerpt}</p>
        <strong>{source.source_label}</strong>
        <button className="sf-modal-primary" onClick={onClose} type="button">
          知道了
        </button>
      </div>
    </div>
  );
}
