"use client";

import { useState } from "react";
import type { SourceDisplayItem } from "@/api-client/single-focus";
import { SourceModal } from "./SourceModal";

type Props = {
  items: SourceDisplayItem[];
  className?: string;
};

export function EvidenceScrollList({ items, className = "" }: Props) {
  const [activeSource, setActiveSource] = useState<SourceDisplayItem | null>(null);
  return (
    <>
      <div className={`sf-evidence-scroll ${className}`} aria-label="来源列表">
        {items.map((item, index) => (
          <button className="sf-evidence-row" key={`${item.id}-${index}`} onClick={() => setActiveSource(item)} type="button">
            <span aria-hidden="true" />
            <p>{item.summary}</p>
          </button>
        ))}
      </div>
      <SourceModal source={activeSource} onClose={() => setActiveSource(null)} />
    </>
  );
}
