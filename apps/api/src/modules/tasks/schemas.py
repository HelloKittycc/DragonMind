from typing import Optional

from pydantic import BaseModel, Field, field_validator

from src.shared.constants import TASK_SOURCE_TYPES, TASK_STATUSES, TASK_TYPES
from src.shared.validators import non_empty_text


class CreateTaskRequest(BaseModel):
    node_id: str = Field(min_length=1)
    task_type: str
    source_type: str
    content: str = Field(min_length=1)
    next_remind_at: Optional[str] = None

    @field_validator("node_id", "content")
    @classmethod
    def validate_text(cls, value: str) -> str:
        return non_empty_text(value, "task field")

    @field_validator("task_type")
    @classmethod
    def validate_task_type(cls, value: str) -> str:
        if value not in TASK_TYPES:
            raise ValueError("invalid task type")
        return value

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, value: str) -> str:
        if value not in TASK_SOURCE_TYPES:
            raise ValueError("invalid task source type")
        return value


class UpdateTaskStatusRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in TASK_STATUSES:
            raise ValueError("invalid task status")
        return value


class UpdateTaskReminderRequest(BaseModel):
    remind_count: Optional[int] = None
    last_remind_at: Optional[str] = None
    next_remind_at: Optional[str] = None


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
