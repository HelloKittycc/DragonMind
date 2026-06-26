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

  return (
    <AppShell>
      <main className="shell stack">
        <PageHeader
          title="Agent观察日报"
          subtitle="今天值得你提高关注度的事项。"
          eyebrow={formatFullDate()}
          actions={
            <>
              <Link className="text-action desktop-only" href="/workspace">
                Workspace
              </Link>
              <Link className="button desktop-only" href="/#quick-capture">
                New Spark
              </Link>
              <Link className="mobile-plus" href="/#quick-capture" aria-label="记录一个新想法">
                +
              </Link>
            </>
          }
        />
        <section className="brief-card panel">
          {items.length ? (
            <>
              <p className="section-kicker">今日简报摘要</p>
              <h2>今天我发现 {items.length} 件值得关注的事</h2>
              <ul>
                <li>{repeatedCount} 个问题重复出现</li>
                <li>{pendingCount} 条 Spark 尚未展开</li>
                <li>{relatedCount} 条记录和历史内容有关</li>
              </ul>
            </>
          ) : (
            <>
              <h2>今天没有明显异常</h2>
              <p>你可以先记录一个新想法。</p>
            </>
          )}
        </section>
        <InputCapture />
        <DiscoveryFeedList items={items} />
      </main>
    </AppShell>
  );
}
