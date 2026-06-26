import { InputCapture } from "@/components/input/InputCapture";
import Link from "next/link";
import { formatFullDate } from "@/api-client/display";
import { getDiscoveryFeed } from "@/api-client/client";
import { DiscoveryFeedList } from "@/components/feed/DiscoveryFeedList";
import { AppShell, PageHeader } from "@/components/layout/AppShell";

export default async function HomePage() {
  const items = await getDiscoveryFeed();
  const repeatedCount = items.filter((item) => item.item_type === "repeated_sparks").length;
  const pendingCount = items.filter((item) => item.item_type === "pending_spark_follow_up").length;
  const relatedCount = items.filter((item) => item.item_type === "related_sparks" || item.item_type === "relation").length;
  const todaySignal = repeatedCount + relatedCount + pendingCount;

  return (
    <AppShell>
      <main className="shell home-shell stack">
        <section className="daily-hero">
          <PageHeader
            title="Agent观察日报"
            subtitle="把今天反复出现、彼此靠近、还没有展开的想法放到同一张桌面上。"
            eyebrow={formatFullDate()}
            actions={
              <>
                <Link className="text-action desktop-only" href="/workspace">
                  工作区
                </Link>
                <Link className="button desktop-only" href="/#quick-capture">
                  记录 Spark
                </Link>
                <Link className="mobile-plus" href="/#quick-capture" aria-label="记录一个新想法">
                  +
                </Link>
              </>
            }
          />
          <div className="brief-card">
            {items.length ? (
              <>
                <p className="section-kicker">今日信号</p>
                <h2>{todaySignal ? `${todaySignal} 条线索需要你看一眼` : `${items.length} 条记录进入观察`}</h2>
                <div className="signal-grid" aria-label="今日简报摘要">
                  <div>
                    <strong>{repeatedCount}</strong>
                    <span>重复出现</span>
                  </div>
                  <div>
                    <strong>{relatedCount}</strong>
                    <span>关联增强</span>
                  </div>
                  <div>
                    <strong>{pendingCount}</strong>
                    <span>待展开想法</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="section-kicker">今日信号</p>
                <h2>今天没有明显异常</h2>
                <p>你可以先记录一个新想法。</p>
              </>
            )}
          </div>
        </section>
        <InputCapture />
        <DiscoveryFeedList items={items} />
      </main>
    </AppShell>
  );
}
