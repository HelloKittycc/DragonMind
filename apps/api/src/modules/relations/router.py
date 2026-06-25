from fastapi import APIRouter, HTTPException

from src.db.database import connection_scope
from src.modules.relations.schemas import (
    CreateRelationRequest,
    RelationRecord,
    UpdateRelationStatusRequest,
)
from src.modules.relations.service import (
    InvalidRelationStatusTransitionError,
    RelationConflictError,
    RelationNotFoundError,
    RelationTargetNotFoundError,
    create_relation,
    update_relation_status,
)


router = APIRouter(prefix="/relations", tags=["relations"])


@router.post("", response_model=RelationRecord)
def post_relation(payload: CreateRelationRequest) -> dict:
    with connection_scope() as conn:
        try:
            return create_relation(
                conn,
                payload.source_node_id,
                payload.target_node_id,
                payload.relation_type,
                payload.relation_reason,
                payload.status,
                payload.created_by,
            )
        except RelationTargetNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except RelationConflictError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.patch("/{relation_id}/status", response_model=RelationRecord)
def patch_relation_status(relation_id: str, payload: UpdateRelationStatusRequest) -> dict:
    with connection_scope() as conn:
        try:
            return update_relation_status(conn, relation_id, payload.status)
        except RelationNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except InvalidRelationStatusTransitionError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except RelationConflictError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc
