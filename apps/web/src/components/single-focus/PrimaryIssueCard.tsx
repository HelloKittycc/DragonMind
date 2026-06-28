import Link from "next/link";
import type { SingleFocusIssue } from "@/api-client/single-focus";
import { EvidenceScrollList } from "./EvidenceScrollList";

type Props = {
  issue: SingleFocusIssue;
};

export function PrimaryIssueCard({ issue }: Props) {
  const hasIssue = issue.title !== "今天暂时没有明显事项";
  return (
    <section className="sf-primary-card">
      <p className="sf-kicker">今天最值得看的一件事</p>
      <h1>{issue.title}</h1>
      <p className="sf-main-judgment">{issue.oneLineJudgment}</p>

      <div className="sf-why-card">
        <strong>我为什么提醒你</strong>
        <p>{issue.why}</p>
      </div>

      {hasIssue ? (
        <>
          <h2 className="sf-section-title">我看到的证据</h2>
          <EvidenceScrollList items={issue.evidence} />
          <div className="sf-recommendation-card">
            <strong>我的建议</strong>
            <p>{issue.recommendation}</p>
          </div>
          <div className="sf-action-row">
            {issue.nodeId ? (
              <Link className="sf-button primary" href={`/nodes/${issue.nodeId}/judge`}>
                帮我判断
              </Link>
            ) : (
              <span className="sf-button primary disabled">帮我判断</span>
            )}
            <button className="sf-button secondary" type="button">
              继续观察
            </button>
            {issue.nodeId ? (
              <Link className="sf-button secondary wide" href={`/nodes/${issue.nodeId}/possible-pattern`}>
                记为可能模式
              </Link>
            ) : (
              <span className="sf-button secondary wide disabled">记为可能模式</span>
            )}
          </div>
        </>
      ) : (
        <div className="sf-empty-panel">
          <p>你可以先记录一个灵光一闪，DragonMind 会判断它是否值得继续追踪。</p>
        </div>
      )}
    </section>
  );
}
