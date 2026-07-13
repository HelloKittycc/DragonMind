import Link from "next/link";
import { formatFullDate } from "@/api-client/display";
import type { ReviewSessionRecord, TopicRecord } from "@/api-client/types";
import { AdvisorDrawer } from "@/components/layout/AdvisorDrawer";
import { BottomCaptureBar } from "@/components/single-focus/BottomCaptureBar";

type Props = {
  topic: TopicRecord;
  currentSession: ReviewSessionRecord;
  sessions: ReviewSessionRecord[];
};

function formatPeriod(start: string, end: string) {
  return `${start.replaceAll("-", ".")} - ${end.replaceAll("-", ".")}`;
}

function sessionStatusLabel(status: string) {
  if (status === "completed") return "已完成";
  if (status === "draft") return "准备中";
  return "复盘中";
}

export function ReviewTopicDetail({ topic, currentSession, sessions }: Props) {
  const history = sessions.filter((session) => session.id !== currentSession.id);

  return (
    <main className="sf-page review-page">
      <section className="sf-phone review-phone">
        <header className="sf-header">
          <AdvisorDrawer buttonClassName="sf-brand-mark sf-menu-button" />
          <strong>DragonMind</strong>
          <time>{formatFullDate()}</time>
        </header>

        <section className="review-primary-card review-topic-card">
          <p className="sf-kicker-static">复盘议题</p>
          <h1>{topic.title}</h1>
          <p className="review-muted">
            {topic.description ||
              "每月 1 号，DragonMind 会自动准备当月复盘。你可以在月中随时纳入资料、记录异常、拆出问题。"}
          </p>

          <Link className="review-current-session" href={`/review/sessions/${currentSession.id}`}>
            <div>
              <span>当前复盘</span>
              <strong>{currentSession.title}</strong>
              <small>覆盖周期：{formatPeriod(currentSession.period_start, currentSession.period_end)}</small>
            </div>
            <em>进入复盘</em>
          </Link>

          <div className="review-section-head">
            <h2>历史复盘</h2>
            <span>{history.length ? "按业务周期倒序" : "暂无历史复盘"}</span>
          </div>

          <div className="review-history-scroll">
            {history.length === 0 ? (
              <p className="review-empty">这个议题还没有完成过历史复盘。</p>
            ) : (
              history.map((session) => (
                <Link className="review-history-row" href={`/review/sessions/${session.id}`} key={session.id}>
                  <strong>{session.title}</strong>
                  <span>
                    {formatPeriod(session.period_start, session.period_end)} · {sessionStatusLabel(session.status)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
        <BottomCaptureBar />
      </section>
    </main>
  );
}
