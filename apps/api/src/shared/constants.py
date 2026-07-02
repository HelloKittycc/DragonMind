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

RELATION_TYPES = {"derived_from", "related", "supports", "contradicts"}
RELATION_STATUSES = {"suggested", "confirmed", "dismissed"}
RELATION_CREATED_BY = {"user", "agent", "system"}

KNOWLEDGE_SOURCE_TYPES = {"paste", "file"}
KNOWLEDGE_MAX_PASTED_TEXT_BYTES = 200 * 1024
KNOWLEDGE_MAX_UPLOADED_FILE_BYTES = 5 * 1024 * 1024
KNOWLEDGE_MAX_CHUNKS_PER_SOURCE = 500
KNOWLEDGE_SUPPORTED_EXTENSIONS = {".txt", ".md", ".csv", ".json"}
KNOWLEDGE_TARGET_CHARS = 1000
KNOWLEDGE_SOFT_MIN_CHARS = 300
KNOWLEDGE_HARD_SPLIT_OVERLAP_CHARS = 100

EXTRACTION_VERSION = "v0.1-minimal"
