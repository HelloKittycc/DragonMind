from typing import Optional

from pydantic import BaseModel, Field, field_validator

from src.shared.validators import non_empty_text


EVIDENCE_TYPES = {"fact", "data", "document", "experience", "radius1_result"}
EVIDENCE_STANCES = {"supports", "contradicts", "neutral"}
EVIDENCE_TARGET_TYPES = {"node", "relation"}


class CreateEvidenceRequest(BaseModel):
    target_type: str
    target_id: str = Field(min_length=1)
    evidence_type: str
    stance: str
    content: str = Field(min_length=1)
    source: Optional[str] = None
    source_url: Optional[str] = None

    @field_validator("target_type")
    @classmethod
    def validate_target_type(cls, value: str) -> str:
        if value not in EVIDENCE_TARGET_TYPES:
            raise ValueError("invalid evidence target type")
        return value

    @field_validator("evidence_type")
    @classmethod
    def validate_evidence_type(cls, value: str) -> str:
        if value not in EVIDENCE_TYPES:
            raise ValueError("invalid evidence type")
        return value

    @field_validator("stance")
    @classmethod
    def validate_stance(cls, value: str) -> str:
        if value not in EVIDENCE_STANCES:
            raise ValueError("invalid evidence stance")
        return value

    @field_validator("target_id", "content")
    @classmethod
    def validate_text(cls, value: str) -> str:
        return non_empty_text(value, "evidence field")


class EvidenceRecord(BaseModel):
    id: str
    target_type: str
    target_id: str
    evidence_type: str
    stance: str
    content: str
    source: Optional[str]
    source_url: Optional[str]
    knowledge_chunk_id: Optional[str] = None
    created_at: str
