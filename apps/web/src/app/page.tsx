import { formatFullDate } from "@/api-client/display";
import { getDiscoveryFeed } from "@/api-client/client";
import { toSingleFocusIssue } from "@/api-client/single-focus";
import { MobileShell } from "@/components/single-focus/MobileShell";
import { PrimaryIssueCard } from "@/components/single-focus/PrimaryIssueCard";

export default async function HomePage() {
  const items = await getDiscoveryFeed();
  const issue = toSingleFocusIssue(items);

  return (
    <MobileShell dateText={formatFullDate()}>
      <PrimaryIssueCard issue={issue} />
    </MobileShell>
  );
}
