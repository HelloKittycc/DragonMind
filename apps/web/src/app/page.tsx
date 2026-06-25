import { InputCapture } from "@/components/input/InputCapture";
import Link from "next/link";
import { getDiscoveryFeed } from "@/api-client/client";
import { DiscoveryFeedList } from "@/components/feed/DiscoveryFeedList";

export default async function HomePage() {
  const items = await getDiscoveryFeed();

  return (
    <main className="shell stack">
      <header className="topbar">
        <div>
          <h1 className="brand">Agent观察日报</h1>
          <p className="muted">Discovery Feed</p>
        </div>
        <Link href="/workspace">Workspace</Link>
      </header>
      <InputCapture />
      <DiscoveryFeedList items={items} />
    </main>
  );
}
