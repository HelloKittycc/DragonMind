import os


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
KNOWLEDGE_MAX_PASTED_TEXT_BYTES = 1 * 1024 * 1024
KNOWLEDGE_DEFAULT_MAX_UPLOADED_FILE_BYTES = 50 * 1024 * 1024
KNOWLEDGE_ABSOLUTE_MAX_UPLOADED_FILE_BYTES = 200 * 1024 * 1024


def _configured_upload_limit() -> int:
    raw = os.getenv("DRAGONMIND_KNOWLEDGE_MAX_UPLOAD_BYTES")
    if raw is None:
        return KNOWLEDGE_DEFAULT_MAX_UPLOADED_FILE_BYTES
    try:
        value = int(raw)
    except ValueError:
        return KNOWLEDGE_DEFAULT_MAX_UPLOADED_FILE_BYTES
    if value <= 0:
        return KNOWLEDGE_DEFAULT_MAX_UPLOADED_FILE_BYTES
    return min(value, KNOWLEDGE_ABSOLUTE_MAX_UPLOADED_FILE_BYTES)


KNOWLEDGE_MAX_UPLOADED_FILE_BYTES = _configured_upload_limit()
KNOWLEDGE_MAX_CHUNKS_PER_SOURCE = 2000
KNOWLEDGE_SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".xlsx", ".csv", ".txt", ".md", ".json"}
KNOWLEDGE_TARGET_CHARS = 1000
KNOWLEDGE_SOFT_MIN_CHARS = 300
KNOWLEDGE_HARD_SPLIT_OVERLAP_CHARS = 100

EXTRACTION_VERSION = "v0.1.1-executive-document"

TOPIC_STATUSES = {"active", "paused", "archived"}
TOPIC_REVIEW_CADENCES = {"monthly", "quarterly"}

REVIEW_SESSION_STATUSES = {"draft", "active", "completed"}
REVIEW_SECTION_TYPES = {
    "current_goal",
    "actual_result",
    "key_deviation",
    "anomaly_signal",
    "core_question",
    "next_plan",
    "open_issue",
}
REVIEW_GUIDING_QUESTION_STATUSES = {"suggested", "dismissed", "converted"}
REVIEW_LINK_TARGET_TYPES = {"node", "knowledge_source"}
REVIEW_SESSION_INPUT_SOURCES = {"user", "agent_suggestion"}

DEFAULT_REVIEW_SECTIONS = [
    ("current_goal", "本期目标"),
    ("actual_result", "实际结果"),
    ("key_deviation", "关键偏差"),
    ("anomaly_signal", "异常信号"),
    ("core_question", "核心问题"),
    ("next_plan", "下期计划"),
    ("open_issue", "遗留问题"),
]
