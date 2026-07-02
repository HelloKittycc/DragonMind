from typing import Optional

from pydantic import BaseModel, Field, field_validator

from src.modules.evidence.schemas import EVIDENCE_STANCES, EVIDENCE_TARGET_TYPES, EVIDENCE_TYPES
from src.shared.constants import KNOWLEDGE_MAX_PASTED_TEXT_BYTES, KNOWLEDGE_SOURCE_TYPES
from src.shared.validators import non_empty_text


class CreateTextKnowledgeSourceRequest(BaseModel):
    title: Optional[str] = None
    content: str = Field(min_length=1)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        stripped = value.strip()
        return stripped or None

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        content = non_empty_text(value, "knowledge content")
        if len(content.encode("utf-8")) > KNOWLEDGE_MAX_PASTED_TEXT_BYTES:
            raise ValueError("pasted text exceeds max size")
        return content


class KnowledgeSourceRecord(BaseModel):
    id: str
    source_type: str
    title: str
    original_filename: Optional[str]
    mime_type: Optional[str]
    storage_path: str
    content_sha256: str
    created_at: str
    updated_at: str

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, value: str) -> str:
        if value not in KNOWLEDGE_SOURCE_TYPES:
            raise ValueError("invalid knowledge source type")
        return value


class KnowledgeChunkRecord(BaseModel):
    id: str
    source_id: str
    chunk_index: int
    content: str
    char_start: Optional[int]
    char_end: Optional[int]
    token_estimate: Optional[int]
    created_at: str


class KnowledgeSourceListItem(KnowledgeSourceRecord):
    chunk_count: int


class CreateKnowledgeSourceResponse(BaseModel):
    source: KnowledgeSourceRecord
    chunks: list[KnowledgeChunkRecord]
    is_duplicate: bool
    duplicate_of_source_id: Optional[str]


class KnowledgeSourceDetailResponse(BaseModel):
    source: KnowledgeSourceRecord
    chunks: list[KnowledgeChunkRecord]


class KnowledgeChunkSearchResult(KnowledgeChunkRecord):
    source_title: str
    snippet: str


class CreateEvidenceFromKnowledgeChunkRequest(BaseModel):
    target_type: str
    target_id: str = Field(min_length=1)
    evidence_type: str
    stance: str
    content_override: Optional[str] = None

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

    @field_validator("target_id")
    @classmethod
    def validate_target_id(cls, value: str) -> str:
        return non_empty_text(value, "evidence target")

    @field_validator("content_override")
    @classmethod
    def validate_content_override(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        stripped = value.strip()
        return stripped or None
