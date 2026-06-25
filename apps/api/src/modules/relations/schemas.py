from typing import Optional

from pydantic import BaseModel, Field, field_validator

from src.shared.constants import RELATION_CREATED_BY, RELATION_STATUSES, RELATION_TYPES
from src.shared.validators import non_empty_text


class CreateRelationRequest(BaseModel):
    source_node_id: str = Field(min_length=1)
    target_node_id: str = Field(min_length=1)
    relation_type: str
    relation_reason: str = Field(min_length=1)
    status: Optional[str] = None
    created_by: str = "user"

    @field_validator("source_node_id", "target_node_id", "relation_reason")
    @classmethod
    def validate_text(cls, value: str) -> str:
        return non_empty_text(value, "relation field")

    @field_validator("relation_type")
    @classmethod
    def validate_relation_type(cls, value: str) -> str:
        if value not in RELATION_TYPES:
            raise ValueError("invalid relation type")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value not in RELATION_STATUSES:
            raise ValueError("invalid relation status")
        return value

    @field_validator("created_by")
    @classmethod
    def validate_created_by(cls, value: str) -> str:
        if value not in RELATION_CREATED_BY:
            raise ValueError("invalid relation creator")
        return value


class UpdateRelationStatusRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in {"confirmed", "dismissed"}:
            raise ValueError("status must be confirmed or dismissed")
        return value


class RelationRecord(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    relation_type: str
    relation_reason: str
    status: str
    created_by: str
    created_at: str
