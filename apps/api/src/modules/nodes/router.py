from fastapi import APIRouter, HTTPException

from src.db.database import connection_scope
from src.modules.nodes.schemas import (
    AppendMessageRequest,
    CreateSparkRequest,
    CreateSparkResponse,
    MessageRecord,
    NodeDetailResponse,
)
from src.modules.nodes.service import NodeNotFoundError, append_message, create_spark, get_node_detail


router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.post("/spark", response_model=CreateSparkResponse)
def post_spark(payload: CreateSparkRequest) -> dict:
    with connection_scope() as conn:
        return create_spark(conn, payload.content, payload.title)


@router.get("/{node_id}", response_model=NodeDetailResponse)
def get_node(node_id: str) -> dict:
    with connection_scope() as conn:
        try:
            return get_node_detail(conn, node_id)
        except NodeNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{node_id}/messages", response_model=MessageRecord)
def post_message(node_id: str, payload: AppendMessageRequest) -> dict:
    with connection_scope() as conn:
        try:
            return append_message(conn, node_id, payload.content, payload.role, payload.message_type)
        except NodeNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
