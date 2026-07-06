"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWorkspaceNodes } from "@/api-client/client";
import type { WorkspaceNodeItem } from "@/api-client/types";
import { SparkCaptureModal } from "@/components/single-focus/SparkCaptureModal";

type Props = {
  buttonClassName?: string;
};

const workspaceLinks = [
  { href: "/workspace?filter=inbox", label: "待处理" },
  { href: "/workspace?filter=active", label: "进行中" },
  { href: "/workspace?filter=decision", label: "决策" },
  { href: "/workspace?filter=all", label: "全部" }
];

export function AdvisorDrawer({ buttonClassName = "advisor-menu-button" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [nodes, setNodes] = useState<WorkspaceNodeItem[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);

  useEffect(() => {
    if (!isOpen || nodes.length > 0 || isLoadingNodes) {
      return;
    }
    setIsLoadingNodes(true);
    getWorkspaceNodes("all")
      .then((items) => setNodes(items.slice(0, 12)))
      .catch(() => setNodes([]))
      .finally(() => setIsLoadingNodes(false));
  }, [isLoadingNodes, isOpen, nodes.length]);

  return (
    <>
      <button className={buttonClassName} aria-label="打开导航" onClick={() => setIsOpen(true)} type="button">
        <span className="advisor-menu-bar long" />
        <span className="advisor-menu-bar short" />
      </button>

      {isOpen ? (
        <div className="advisor-drawer-stage" role="dialog" aria-modal="true" aria-label="DragonMind 侧边栏">
          <button className="advisor-drawer-scrim" aria-label="关闭导航" onClick={() => setIsOpen(false)} type="button" />
          <aside className="advisor-drawer-panel">
            <div className="advisor-drawer-scroll">
              <div className="advisor-drawer-title">DragonMind</div>

              <nav className="advisor-drawer-section" aria-label="主要导航">
                <Link className="advisor-drawer-link primary" href="/" onClick={() => setIsOpen(false)}>
                  观察日报
                </Link>
              </nav>

              <nav className="advisor-drawer-section" aria-label="工作区">
                <div className="advisor-drawer-heading">工作区</div>
                {workspaceLinks.map((item) => (
                  <Link className="advisor-drawer-link nested" href={item.href} key={item.href} onClick={() => setIsOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </nav>

              <nav className="advisor-drawer-section" aria-label="最近线索">
                <div className="advisor-drawer-heading">线索</div>
                {isLoadingNodes ? <p className="advisor-drawer-muted">正在读取线索</p> : null}
                {!isLoadingNodes && nodes.length === 0 ? <p className="advisor-drawer-muted">还没有线索</p> : null}
                {nodes.map((item) => (
                  <Link
                    className="advisor-drawer-link clue"
                    href={`/nodes/${item.node.id}`}
                    key={item.node.id}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.node.title}
                  </Link>
                ))}
              </nav>

              <nav className="advisor-drawer-section" aria-label="资料与证据">
                <Link className="advisor-drawer-link primary" href="/knowledge" onClick={() => setIsOpen(false)}>
                  资料与证据
                </Link>
              </nav>
            </div>

            <div className="advisor-drawer-footer">
              <button
                className="advisor-capture-button"
                onClick={() => {
                  setIsCaptureOpen(true);
                  setIsOpen(false);
                }}
                type="button"
              >
                <span>+</span>
                灵光一闪
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <SparkCaptureModal isOpen={isCaptureOpen} onClose={() => setIsCaptureOpen(false)} />
    </>
  );
}
