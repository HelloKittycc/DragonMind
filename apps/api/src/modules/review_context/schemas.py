from typing import Optional
from datetime import date

from pydantic import BaseModel, Field, field_validator, model_validator

from src.shared.constants import (
    REVIEW_SESSION_STATUSES,
    TOPIC_REVIEW_CADENCES,
    TOPIC_STATUSES,
)
from src.shared.validators import non_empty_text


def _normalize_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    stripped = value.strip()
    return stripped or None


def _validate_date_string(value: str, field_name: str) -> str:
    stripped = non_empty_text(value, field_name)
    try:
        date.fromisoformat(stripped)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be YYYY-MM-DD") from exc
    return stripped


class CreateTopicRequest(BaseModel):
    title: str = Field(min_length=1)
    description: Optional[str] = None
    status: str = "active"
    review_cadence: Optional[str] = None
    next_review_at: Optional[str] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return non_empty_text(value, "topic title")

    @field_validator("description", "next_review_at")
    @classmethod
    def validate_optional_text(cls, value: Optional[str]) -> Optional[str]:
        return _normalize_optional_text(value)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in TOPIC_STATUSES:
            raise ValueError("invalid topic status")
        return value

    @field_validator("review_cadence")
    @classmethod
    def validate_review_cadence(cls, value: Optional[str]) -> Optional[str]:
        value = _normalize_optional_text(value)
        if value is not None and value not in TOPIC_REVIEW_CADENCES:
            raise ValueError("invalid topic review cadence")
        return value


class UpdateTopicRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    review_cadence: Optional[str] = None
    next_review_at: Optional[str] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return non_empty_text(value, "topic title")

    @field_validator("description", "next_review_at")
    @classmethod
    def validate_optional_text(cls, value: Optional[str]) -> Optional[str]:
        return _normalize_optional_text(value)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in TOPIC_STATUSES:
            raise ValueError("invalid topic status")
        return value

    @field_validator("review_cadence")
    @classmethod
    def validate_review_cadence(cls, value: Optional[str]) -> Optional[str]:
        value = _normalize_optional_text(value)
        if value is not None and value not in TOPIC_REVIEW_CADENCES:
            raise ValueError("invalid topic review cadence")
        return value


class CreateReviewSessionRequest(BaseModel):
    primary_topic_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    period_start: str = Field(min_length=1)
    period_end: str = Field(min_length=1)
    status: str = "draft"

    @field_validator("primary_topic_id")
    @classmethod
    def validate_primary_topic_id(cls, value: str) -> str:
        return non_empty_text(value, "primary topic")

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return non_empty_text(value, "review session title")

    @field_validator("period_start")
    @classmethod
    def validate_period_start(cls, value: str) -> str:
        return _validate_date_string(value, "period_start")

    @field_validator("period_end")
    @classmethod
    def validate_period_end(cls, value: str) -> str:
        return _validate_date_string(value, "period_end")

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in REVIEW_SESSION_STATUSES:
            raise ValueError("invalid review session status")
        return value

    @model_validator(mode="after")
    def validate_period_order(self) -> "CreateReviewSessionRequest":
        if self.period_start > self.period_end:
            raise ValueError("period_start cannot be after period_end")
        return self


class UpdateReviewSessionRequest(BaseModel):
    title: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    status: Optional[str] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return non_empty_text(value, "review session title")

    @field_validator("period_start")
    @classmethod
    def validate_period_start(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validate_date_string(value, "period_start")

    @field_validator("period_end")
    @classmethod
    def validate_period_end(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validate_date_string(value, "period_end")

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in REVIEW_SESSION_STATUSES:
            raise ValueError("invalid review session status")
        return value


class UpdateReviewSectionRequest(BaseModel):
    content: Optional[str] = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return value.strip() or None


class TopicRecord(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: str
    review_cadence: Optional[str]
    next_review_at: Optional[str]
    created_at: str
    updated_at: str


class ReviewSectionRecord(BaseModel):
    id: str
    session_id: str
    section_type: str
    title: str
    content: Optional[str]
    sort_order: int
    created_at: str
    updated_at: str


class ReviewSessionRecord(BaseModel):
    id: str
    primary_topic_id: str
    title: str
    period_start: str
    period_end: str
    status: str
    created_at: str
    updated_at: str
    completed_at: Optional[str]


class ReviewSessionDetailResponse(BaseModel):
    session: ReviewSessionRecord
    sections: list[ReviewSectionRecord]
