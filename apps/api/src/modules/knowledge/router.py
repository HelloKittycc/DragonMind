from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from src.db.database import connection_scope
from src.modules.evidence.schemas import EvidenceRecord
from src.modules.evidence.service import EvidenceTargetNotFoundError
from src.modules.knowledge.schemas import (
    CreateEvidenceFromKnowledgeChunkRequest,
    CreateKnowledgeSourceResponse,
    CreateTextKnowledgeSourceRequest,
    KnowledgeChunkSearchResult,
    KnowledgeSourceDetailResponse,
    KnowledgeSourceListItem,
)
from src.modules.knowledge.service import (
    KnowledgeChunkNotFoundError,
    KnowledgeSourceNotFoundError,
    KnowledgeValidationError,
    create_evidence_from_chunk,
    create_file_source,
    create_text_source,
    get_source_detail,
    list_sources,
    search_chunks,
)
from src.shared.constants import KNOWLEDGE_SOURCE_TYPES


router = APIRouter(tags=["knowledge"])


@router.post("/knowledge-sources/text", response_model=CreateKnowledgeSourceResponse)
def post_text_source(payload: CreateTextKnowledgeSourceRequest) -> dict:
    with connection_scope() as conn:
        try:
            return create_text_source(conn, payload.title, payload.content)
        except KnowledgeValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/knowledge-sources/file", response_model=CreateKnowledgeSourceResponse)
def post_file_source(file: UploadFile = File(...), title: Optional[str] = Form(None)) -> dict:
    with connection_scope() as conn:
        try:
            content = file.file.read()
            return create_file_source(conn, title, file.filename or "", file.content_type, content)
        except KnowledgeValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/knowledge-sources", response_model=list[KnowledgeSourceListItem])
def get_sources(
    q: Optional[str] = None,
    source_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[dict]:
    if source_type is not None and source_type not in KNOWLEDGE_SOURCE_TYPES:
        raise HTTPException(status_code=400, detail="invalid knowledge source type")
    with connection_scope() as conn:
        return list_sources(conn, q, source_type, limit, offset)


@router.get("/knowledge-sources/{source_id}", response_model=KnowledgeSourceDetailResponse)
def get_source(source_id: str) -> dict:
    with connection_scope() as conn:
        try:
            return get_source_detail(conn, source_id)
        except KnowledgeSourceNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/knowledge-chunks/search", response_model=list[KnowledgeChunkSearchResult])
def get_chunk_search(
    q: str = Query(..., min_length=1),
    source_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[dict]:
    with connection_scope() as conn:
        return search_chunks(conn, q, source_id, limit, offset)


@router.post("/knowledge-chunks/{chunk_id}/evidence", response_model=EvidenceRecord)
def post_chunk_evidence(chunk_id: str, payload: CreateEvidenceFromKnowledgeChunkRequest) -> dict:
    with connection_scope() as conn:
        try:
            return create_evidence_from_chunk(
                conn,
                chunk_id,
                payload.target_type,
                payload.target_id,
                payload.evidence_type,
                payload.stance,
                payload.content_override,
            )
        except KnowledgeChunkNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except EvidenceTargetNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
