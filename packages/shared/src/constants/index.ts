export const nodeTypes = ["spark", "reasoning", "decision_prep", "decision"] as const;
export const lifecycleStatuses = ["open", "closed", "archived"] as const;
export const messageRoles = ["user", "agent", "system"] as const;
export const messageTypes = [
  "original",
  "reply",
  "reasoning",
  "decision_prep",
  "decision",
  "correction",
  "edit",
  "command_result"
] as const;
