"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTopics, getWorkspaceNodes } from "@/api-client/client";
import type { TopicRecord, WorkspaceNodeItem } from "@/api-client/types";
import { SparkCaptureModal } from "@/components/single-focus/SparkCaptureModal";

type Props = {
  buttonClassName?: string;
};

const workspaceLinks = [
  { filter: "inbox", label: "待处理" },
  { filter: "active", label: "进行中" },
  { filter: "decision", label: "决策" },
  { filter: "all", label: "全部" }
];

export function AdvisorDrawer({ buttonClassName = "advisor-menu-button" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [nodesByFilter, setNodesByFilter] = useState<Record<string, WorkspaceNodeItem[]>>({});
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set(["inbox", "active", "decision"]));
  const [topics, setTopics] = useState<TopicRecord[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let isCurrent = true;
    setIsLoadingNodes(true);
    Promise.all([
      Promise.all(workspaceLinks.map((item) => getWorkspaceNodes(item.filter).then((nodes) => [item.filter, nodes.slice(0, 4)] as const))),
      getTopics()
    ])
      .then(([workspaceResults, topicResults]) => {
        if (isCurrent) {
          const nextNodes: Record<string, WorkspaceNodeItem[]> = {};
          for (const result of workspaceResults) {
            nextNodes[result[0]] = result[1];
          }
          setNodesByFilter(nextNodes);
          setTopics(topicResults.filter((topic) => topic.status === "active"));
        }
      })
      .catch(() => {
        if (isCurrent) {
          setNodesByFilter({});
          setTopics([]);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingNodes(false);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  function toggleFilter(filter: string) {
    setExpandedFilters((current) => {
      const next = new Set(current);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }

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
                <div className="advisor-drawer-link primary">工作区</div>
                {workspaceLinks.map((item) => {
                  const isExpanded = expandedFilters.has(item.filter);
                  const nodes = nodesByFilter[item.filter] ?? [];
                  return (
                    <div className="advisor-drawer-group" key={item.filter}>
                      <button className="advisor-drawer-link nested" onClick={() => toggleFilter(item.filter)} type="button">
                        {item.label}
                      </button>
                      {isExpanded ? (
                        <div className="advisor-drawer-children">
                          {isLoadingNodes ? <p className="advisor-drawer-muted tertiary">正在读取线索</p> : null}
                          {!isLoadingNodes && nodes.length === 0 ? <p className="advisor-drawer-muted tertiary">还没有线索</p> : null}
                          {nodes.map((nodeItem) => (
                            <Link
                              className="advisor-drawer-link clue"
                              href={`/nodes/${nodeItem.node.id}`}
                              key={`${item.filter}-${nodeItem.node.id}`}
                              onClick={() => setIsOpen(false)}
                            >
                              {nodeItem.node.title}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </nav>

              <nav className="advisor-drawer-section" aria-label="复盘议题">
                <div className="advisor-drawer-link primary">复盘议题</div>
                {topics.length === 0 ? <p className="advisor-drawer-muted nested">还没有进行中的议题</p> : null}
                {topics.map((topic) => (
                  <Link
                    className="advisor-drawer-link nested"
                    href={`/review/topics/${topic.id}`}
                    key={topic.id}
                    onClick={() => setIsOpen(false)}
                  >
                    {topic.title}
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
