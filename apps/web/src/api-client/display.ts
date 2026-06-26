import type { DiscoveryFeedItem, EvidenceRecord, MessageRecord, NodeRecord, RelationRecord, TaskRecord } from "./types";

export const nodeTypeLabel: Record<string, string> = {
  spark: "Spark / 想法",
  reasoning: "Reasoning / 推理",
  decision_prep: "Decision Prep / 决策准备",
  decision: "Decision / 决策"
};

export const lifecycleLabel: Record<string, string> = {
  open: "进行中",
  closed: "已关闭",
  archived: "已归档"
};

export const messageTypeLabel: Record<string, string> = {
  original: "原始记录",
  reply: "补充记录",
  reasoning: "推理",
  decision_prep: "决策准备",
  decision: "最终决策",
  correction: "修正",
  edit: "编辑",
  command_result: "系统操作"
};

export const roleLabel: Record<string, string> = {
  user: "你",
  agent: "DragonMind",
  system: "系统"
};

export const taskTypeLabel: Record<string, string> = {
  spark_follow_up: "待展开",
  discovery_expand: "建议展开",
  verify: "待验证",
  review: "待复盘",
  manual: "手动任务"
};

export const taskStatusLabel: Record<string, string> = {
  pending: "待处理",
  sleeping: "已休眠",
  completed: "已完成"
};

export const relationTypeLabel: Record<string, string> = {
  derived_from: "来源于",
  related: "相关",
  supports: "支持",
  contradicts: "冲突"
};

export const relationStatusLabel: Record<string, string> = {
  suggested: "待确认",
  confirmed: "已确认",
  dismissed: "已忽略"
};

export const evidenceStanceLabel: Record<string, string> = {
  supports: "支持",
  contradicts: "反驳",
  neutral: "中性记录"
};

export const evidenceTypeLabel: Record<string, string> = {
  fact: "事实",
  data: "数据",
  document: "文档",
  experience: "经验",
  radius1_result: "Radius1 结果"
};

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatFullDate(value = new Date()): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(value);
}

export function attentionLabel(score: number): string {
  if (score >= 80) {
    return "高关注";
  }
  if (score >= 60) {
    return "中关注";
  }
  return "低关注";
}

export function feedCopy(item: DiscoveryFeedItem): {
  badge: string;
  title: string;
  explanation: string;
  reason: string;
  primaryAction: string;
  secondaryAction: string;
} {
  switch (item.item_type) {
    case "repeated_sparks":
      return {
        badge: "重复出现",
        title: `我发现：“${item.title}”正在重复出现`,
        explanation: "最近出现了多条相似 Spark，可能代表一个正在形成的趋势。",
        reason: "原因：相似记录再次出现，系统已建立待确认关联。",
        primaryAction: "查看重复记录",
        secondaryAction: "展开分析"
      };
    case "related_sparks":
      return {
        badge: "关联增强",
        title: "我发现它和之前的记录有关",
        explanation: "这条 Spark 与历史记录存在相似关键词或实体，建议查看是否属于同一问题。",
        reason: "原因：它与历史 Spark 存在相似内容。",
        primaryAction: "查看关联",
        secondaryAction: "确认关联"
      };
    case "pending_spark_follow_up":
      return {
        badge: "待展开想法",
        title: "这个想法还没有展开",
        explanation: "你已经记录了这条 Spark，但它还没有进入 Reasoning。如果它仍然重要，可以把它展开成一段推理。",
        reason: "原因：该 Spark 仍有待处理 follow-up。",
        primaryAction: "展开分析",
        secondaryAction: "稍后提醒"
      };
    case "discovery_task":
      return {
        badge: "建议展开",
        title: "这里值得进一步看看",
        explanation: "DragonMind 发现这条记录可能需要你补充背景、检查关联或继续展开。",
        reason: "原因：它来自一次 Discovery 观察。",
        primaryAction: "展开分析",
        secondaryAction: "完成"
      };
    case "basic_contradiction":
      return {
        badge: "出现冲突",
        title: "这和之前的判断不一致",
        explanation: "系统发现它可能和历史记录存在相反表达，建议回到详情页核对上下文。",
        reason: "原因：相似内容里出现了相反倾向。",
        primaryAction: "查看来源",
        secondaryAction: "展开分析"
      };
    case "evidence":
      return {
        badge: "有新证据",
        title: item.title.includes("contradicts") ? "有资料反驳某条记录" : "有资料支持某条记录",
        explanation: "这条 Evidence 已挂载到认知对象上，可作为后续判断的事实材料。",
        reason: "原因：有新的事实材料进入系统。",
        primaryAction: "查看证据",
        secondaryAction: "查看对象"
      };
    case "relation":
    default:
      return {
        badge: "新关联",
        title: "我发现两个认知对象之间可能有关",
        explanation: "系统发现两条记录之间存在相关性，建议查看它们是否属于同一问题链路。",
        reason: "原因：存在待查看或已确认的认知关系。",
        primaryAction: "查看关联",
        secondaryAction: "打开对象"
      };
  }
}

export function nodeSummary(node: NodeRecord): string {
  return `${nodeTypeLabel[node.node_type] ?? node.node_type} · ${lifecycleLabel[node.lifecycle_status] ?? node.lifecycle_status}`;
}

export function taskSummary(task: TaskRecord): string {
  return `${taskTypeLabel[task.task_type] ?? task.task_type} · ${taskStatusLabel[task.status] ?? task.status}`;
}

export function taskDescription(task: TaskRecord): string {
  if (task.task_type === "spark_follow_up") {
    return "这个想法已经记录，但还没有展开。如果它仍然重要，可以进入 Reasoning。";
  }
  if (task.task_type === "discovery_expand" && task.content.includes("repeated")) {
    return "最近出现了相似记录，建议展开看看是否存在共同原因。";
  }
  if (task.task_type === "discovery_expand" && task.content.includes("related")) {
    return "这条记录和历史内容有关，建议查看是否属于同一问题。";
  }
  if (task.task_type === "discovery_expand") {
    return "DragonMind 发现这里值得进一步看看。";
  }
  return task.content;
}

export function messageMeta(message: MessageRecord): string {
  return `${roleLabel[message.role] ?? message.role} · ${messageTypeLabel[message.message_type] ?? message.message_type} · ${formatDateTime(message.created_at)}`;
}

export function relationSummary(relation: RelationRecord): string {
  return `${relationTypeLabel[relation.relation_type] ?? relation.relation_type} · ${relationStatusLabel[relation.status] ?? relation.status}`;
}

export function relationReason(relation: RelationRecord): string {
  if (relation.relation_reason === "Repeated Spark discovery") {
    return "重复出现";
  }
  if (relation.relation_reason === "Related Spark discovery") {
    return "关联增强";
  }
  if (relation.relation_reason === "Simple contradiction detection") {
    return "出现冲突";
  }
  if (relation.relation_reason === "Stage progression") {
    return "认知链路推进";
  }
  return relation.relation_reason || "发现了一条相关线索";
}

export function evidenceSummary(evidence: EvidenceRecord): string {
  return `${evidenceStanceLabel[evidence.stance] ?? evidence.stance} · ${evidenceTypeLabel[evidence.evidence_type] ?? evidence.evidence_type}`;
}
