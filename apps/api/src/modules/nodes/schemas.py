from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from src.shared.constants import MESSAGE_ROLES, MESSAGE_TYPES
from src.shared.validators import non_empty_text


class CreateSparkRequest(BaseModel):
    content: str = Field(min_length=1)
    title: Optional[str] = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        return non_empty_text(value, "content")

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return non_empty_text(value, "title")


class AppendMessageRequest(BaseModel):
    content: str = Field(min_length=1)
    role: str = "user"
    message_type: str = "reply"

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        return non_empty_text(value, "content")

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in MESSAGE_ROLES:
            raise ValueError("invalid message role")
        return value

    @field_validator("message_type")
    @classmethod
    def validate_message_type(cls, value: str) -> str:
        if value not in MESSAGE_TYPES:
            raise ValueError("invalid message type")
        return value


class ProgressNodeRequest(BaseModel):
    content: str = Field(min_length=1)
    title: Optional[str] = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        return non_empty_text(value, "content")

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return non_empty_text(value, "title")


class NodeRecord(BaseModel):
    id: str
    node_type: str
    title: str
    lifecycle_status: str
    created_at: str
    updated_at: str
    archived_at: Optional[str]


class MessageRecord(BaseModel):
    id: str
    node_id: str
    role: str
    content: str
    message_type: str
    created_at: str


class InterpretationRecord(BaseModel):
    id: str
    node_id: str
    entities_json: str
    keywords_json: str
    extraction_version: str
    created_at: str


class TaskRecord(BaseModel):
    id: str
    node_id: str
    task_type: str
    source_type: str
    content: str
    status: str
    remind_count: int
    last_remind_at: Optional[str]
    next_remind_at: Optional[str]
    archived_at: Optional[str]
    created_at: str
    updated_at: str


class RelationRecord(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    relation_type: str
    relation_reason: str
    status: str
    created_by: str
    created_at: str


class NodeDetailResponse(BaseModel):
    node: NodeRecord
    messages: List[MessageRecord]
    latest_interpretation: Optional[InterpretationRecord]
    tasks: List[TaskRecord]
    relations: List[RelationRecord] = []


class WorkspaceNodeItem(BaseModel):
    node: NodeRecord
    latest_message: Optional[MessageRecord]
    pending_tasks: List[TaskRecord]


class CreateSparkResponse(NodeDetailResponse):
    pass
