NODE_TYPES = {"spark", "reasoning", "decision_prep", "decision"}
LIFECYCLE_STATUSES = {"open", "closed", "archived"}

MESSAGE_ROLES = {"user", "agent", "system"}
MESSAGE_TYPES = {
    "original",
    "reply",
    "reasoning",
    "decision_prep",
    "decision",
    "correction",
    "edit",
    "command_result",
}

TASK_TYPES = {"spark_follow_up", "discovery_expand", "verify", "review", "manual"}
TASK_SOURCE_TYPES = {"spark", "discovery", "user", "system"}
TASK_STATUSES = {"pending", "sleeping", "completed"}

EXTRACTION_VERSION = "v0.1-minimal"
