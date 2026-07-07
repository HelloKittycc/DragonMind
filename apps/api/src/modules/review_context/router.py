from fastapi import APIRouter, HTTPException

from src.db.database import connection_scope
from src.modules.review_context.schemas import (
    CreateReviewSessionRequest,
    CreateTopicRequest,
    ReviewSectionRecord,
    ReviewSessionDetailResponse,
    TopicRecord,
    UpdateReviewSectionRequest,
    UpdateReviewSessionRequest,
    UpdateTopicRequest,
)
from src.modules.review_context.service import (
    ReviewSectionNotFoundError,
    ReviewSessionNotFoundError,
    ReviewValidationError,
    TopicNotFoundError,
    create_review_session,
    create_topic,
    get_review_session_detail,
    get_topic,
    list_topics,
    update_review_section,
    update_review_session,
    update_topic,
)


router = APIRouter(tags=["review-context"])


@router.post("/topics", response_model=TopicRecord)
def post_topic(payload: CreateTopicRequest) -> dict:
    with connection_scope() as conn:
        return create_topic(
            conn,
            payload.title,
            payload.description,
            payload.status,
            payload.review_cadence,
            payload.next_review_at,
        )


@router.get("/topics", response_model=list[TopicRecord])
def get_topics() -> list[dict]:
    with connection_scope() as conn:
        return list_topics(conn)


@router.get("/topics/{topic_id}", response_model=TopicRecord)
def get_topic_detail(topic_id: str) -> dict:
    with connection_scope() as conn:
        try:
            return get_topic(conn, topic_id)
        except TopicNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/topics/{topic_id}", response_model=TopicRecord)
def patch_topic(topic_id: str, payload: UpdateTopicRequest) -> dict:
    with connection_scope() as conn:
        try:
            return update_topic(
                conn,
                topic_id,
                payload.title,
                payload.description,
                payload.status,
                payload.review_cadence,
                payload.next_review_at,
            )
        except TopicNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/review-sessions", response_model=ReviewSessionDetailResponse)
def post_review_session(payload: CreateReviewSessionRequest) -> dict:
    with connection_scope() as conn:
        try:
            return create_review_session(
                conn,
                payload.primary_topic_id,
                payload.title,
                payload.period_start,
                payload.period_end,
                payload.status,
            )
        except TopicNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/review-sessions/{session_id}", response_model=ReviewSessionDetailResponse)
def get_review_session(session_id: str) -> dict:
    with connection_scope() as conn:
        try:
            return get_review_session_detail(conn, session_id)
        except ReviewSessionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/review-sessions/{session_id}", response_model=ReviewSessionDetailResponse)
def patch_review_session(session_id: str, payload: UpdateReviewSessionRequest) -> dict:
    with connection_scope() as conn:
        try:
            return update_review_session(
                conn,
                session_id,
                payload.title,
                payload.period_start,
                payload.period_end,
                payload.status,
            )
        except ReviewSessionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/review-sections/{section_id}", response_model=ReviewSectionRecord)
def patch_review_section(section_id: str, payload: UpdateReviewSectionRequest) -> dict:
    with connection_scope() as conn:
        try:
            return update_review_section(conn, section_id, payload.content)
        except ReviewSectionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
