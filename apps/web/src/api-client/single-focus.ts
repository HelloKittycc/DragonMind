import { feedCopy, formatDateTime, relationReason } from "./display";
import type { DiscoveryFeedItem, NodeDetail, RelationRecord } from "./types";

export type SourceDisplayItem = {
  id: string;
  summary: string;
  source_type: "node" | "node_message" | "evidence" | "relation" | "task" | "feed";
  source_id: string;
  source_title: string;
  source_excerpt: string;
  source_label: string;
};

export type SingleFocusIssue = {
  nodeId: string | null;
  title: string;
  oneLineJudgment: string;
  why: string;
  recommendation: string;
  evidence: SourceDisplayItem[];
};

export type JudgmentDisplayModel = {
  nodeId: string;
  question: string;
  recommendation: string;
  reasons: SourceDisplayItem[];
  minimumNextStep: string;
  acceptedMessage: string;
  disagreeMessage: string;
};

export type PossiblePatternDisplayModel = {
  nodeId: string;
  title: string;
  confidenceSentence: string;
  rationale: SourceDisplayItem[];
  status: string;
  statusExplanation: string;
  confirmMessage: string;
  dismissMessage: string;
};

const fallbackIssue: SingleFocusIssue = {
  nodeId: null,
  title: "今天暂时没有明显事项",
  oneLineJudgment: "你可以先记录一个灵光一闪，DragonMind 会判断它是否值得继续追踪。",
  why: "当前没有足够强的重复、关联或待判断信号。",
  recommendation: "先记录一个新的观察，让 DragonMind 帮你判断它是否值得追踪。",
  evidence: []
};

export function toSingleFocusIssue(items: DiscoveryFeedItem[]): SingleFocusIssue {
  if (items.length === 0) {
    return fallbackIssue;
  }
  const top = [...items].sort((a, b) => b.runtime_importance - a.runtime_importance)[0];
  const copy = feedCopy(top);
  return {
    nodeId: top.node_id,
    title: top.title || copy.title,
    oneLineJudgment: displayFeedDescription(top, copy.explanation),
    why: copy.reason.replace(/^原因：/, "") || "这条线索和最近的记录、任务或证据有关，值得先判断是否继续追踪。",
    recommendation: recommendationFor(top),
    evidence: evidenceFromFeed(top, items)
  };
}

export function toJudgmentDisplayModel(detail: NodeDetail): JudgmentDisplayModel {
  const latestMessage = detail.messages.at(-1);
  const reasons = [
    sourceFromMessage(detail, "它让你先关注问题本身，而不是管理系统结构。", 0),
    sourceFromRelation(detail.relations[0], "它和历史记录存在关联，说明这不是孤立想法。"),
    sourceFromMessage(detail, latestMessage?.content || "它已经进入 DragonMind 的当前判断范围。", 1)
  ];
  return {
    nodeId: detail.node.id,
    question: `要不要继续判断「${detail.node.title}」？`,
    recommendation: "先判断，不要急着扩展结构。",
    reasons,
    minimumNextStep: "把这条线索压缩成一个单焦点判断，再决定是否继续追踪。",
    acceptedMessage: `我接受 DragonMind 的建议：先围绕「${detail.node.title}」做单焦点判断。`,
    disagreeMessage: `我不同意 DragonMind 对「${detail.node.title}」的当前建议，我想继续补充反例。`
  };
}

export function toPossiblePatternDisplayModel(detail: NodeDetail): PossiblePatternDisplayModel {
  const relationCount = detail.relations.length;
  const evidenceCount = detail.evidence.length;
  const signalCount = Math.max(1, relationCount + evidenceCount);
  const confidence = signalCount >= 3 ? "中" : "低";
  return {
    nodeId: detail.node.id,
    title: `可能模式：${detail.node.title}`,
    confidenceSentence: `出现${signalCount}次，可信度：${confidence}。先继续观察，不急着沉淀为原则。`,
    rationale: [
      sourceFromRelation(detail.relations[0], "这条线索已经和历史内容产生关联。"),
      sourceFromMessage(detail, detail.messages.at(-1)?.content || "你已经围绕它留下了可追踪记录。", 0),
      sourceFromRelation(detail.relations[1], "如果它再次出现，可以考虑升级为产品原则。")
    ],
    status: "继续观察，暂不沉淀。",
    statusExplanation: "当它再次影响产品入口判断时，再考虑升级为产品原则。",
    confirmMessage: `我确认「${detail.node.title}」可以作为当前阶段的产品原则来参考。`,
    dismissMessage: `我暂时忽略「${detail.node.title}」这个可能模式。`
  };
}

function recommendationFor(item: DiscoveryFeedItem): string {
  if (item.item_type === "repeated_sparks") {
    return "先不要扩展更多页面，先判断这是否代表一个反复出现的问题。";
  }
  if (item.item_type === "related_sparks" || item.item_type === "relation") {
    return "先看它和历史记录的关系，再决定是否继续追踪。";
  }
  if (item.item_type === "pending_spark_follow_up") {
    return "先把这个灵光一闪展开成一个可判断的问题。";
  }
  return "先做一个轻量判断，确认它是否值得今天继续看。";
}

function evidenceFromFeed(top: DiscoveryFeedItem, items: DiscoveryFeedItem[]): SourceDisplayItem[] {
  const related = items.filter((item) => item.node_id === top.node_id || item === top).slice(0, 3);
  const base = related.length ? related : [top];
  return base.map((item, index) => ({
    id: `${item.item_type}-${item.node_id ?? item.task_id ?? item.relation_id ?? item.evidence_id ?? index}`,
    summary: evidenceSummary(item, index),
    source_type: "feed",
    source_id: item.node_id ?? item.task_id ?? item.relation_id ?? item.evidence_id ?? item.item_type,
    source_title: item.title || "来源记录",
    source_excerpt: displayFeedDescription(item, feedCopy(item).explanation),
    source_label: `来源：${sourceLabel(item)} · ${formatDateTime(item.created_at)}`
  }));
}

function evidenceSummary(item: DiscoveryFeedItem, index: number): string {
  if (item.description) {
    return displayFeedDescription(item, item.description);
  }
  if (index === 0) {
    return feedCopy(item).explanation;
  }
  return feedCopy(item).reason.replace(/^原因：/, "");
}

function sourceLabel(item: DiscoveryFeedItem): string {
  switch (item.item_type) {
    case "repeated_sparks":
      return "重复出现";
    case "related_sparks":
      return "关联线索";
    case "pending_spark_follow_up":
      return "待展开灵感";
    case "discovery_task":
      return "观察任务";
    case "evidence":
      return "证据";
    case "relation":
      return "关系";
    default:
      return "DragonMind 观察";
  }
}

function sourceFromMessage(detail: NodeDetail, summary: string, index: number): SourceDisplayItem {
  const message = detail.messages[index] ?? detail.messages.at(-1);
  return {
    id: message?.id ?? `${detail.node.id}-message-${index}`,
    summary,
    source_type: "node_message",
    source_id: message?.id ?? detail.node.id,
    source_title: detail.node.title,
    source_excerpt: message?.content ?? summary,
    source_label: message ? `来源：记录 · ${formatDateTime(message.created_at)}` : "来源：当前线索"
  };
}

function sourceFromRelation(relation: RelationRecord | undefined, fallback: string): SourceDisplayItem {
  const summary = relation ? relationReason(relation) : fallback;
  return {
    id: relation?.id ?? `relation-fallback-${fallback}`,
    summary,
    source_type: "relation",
    source_id: relation?.id ?? "relation-fallback",
    source_title: relation ? "相关来源" : "来源记录",
    source_excerpt: summary,
    source_label: relation ? `来源：关系 · ${formatDateTime(relation.created_at)}` : "来源：DragonMind 判断"
  };
}

function displayFeedDescription(item: DiscoveryFeedItem, fallback: string): string {
  const title = item.title || "这条线索";
  if (item.item_type === "related_sparks" || item.description?.startsWith("related ")) {
    return `这条线索与「${title}」存在关联，值得判断是否属于同一问题。`;
  }
  if (item.item_type === "repeated_sparks" || item.description?.startsWith("repeated ")) {
    return `「${title}」反复出现，可能不是一次性的想法。`;
  }
  if (item.item_type === "pending_spark_follow_up") {
    return `「${title}」还没有展开，适合先压缩成一个可判断的问题。`;
  }
  if (item.description === "Related Spark discovery") {
    return "DragonMind 发现它和历史记录存在关联。";
  }
  if (item.description === "Repeated Spark discovery") {
    return "DragonMind 发现它正在重复出现。";
  }
  return fallback;
}
