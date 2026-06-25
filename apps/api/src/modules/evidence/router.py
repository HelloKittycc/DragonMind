from fastapi import APIRouter, HTTPException, Query

from src.db.database import connection_scope
from src.modules.evidence.schemas import CreateEvidenceRequest, EvidenceRecord
from src.modules.evidence.service import (
    EvidenceTargetNotFoundError,
    create_evidence,
    list_evidence,
)


router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post("", response_model=EvidenceRecord)
def post_evidence(payload: CreateEvidenceRequest) -> dict:
    with connection_scope() as conn:
        try:
            return create_evidence(
                conn,
                payload.target_type,
                payload.target_id,
                payload.evidence_type,
                payload.stance,
                payload.content,
                payload.source,
                payload.source_url,
            )
        except EvidenceTargetNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("", response_model=list[EvidenceRecord])
def get_evidence(target_type: str = Query(...), target_id: str = Query(...)) -> list[dict]:
    with connection_scope() as conn:
        try:
            return list_evidence(conn, target_type, target_id)
        except EvidenceTargetNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
