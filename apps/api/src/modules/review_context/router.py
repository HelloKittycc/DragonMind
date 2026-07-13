from fastapi import APIRouter, HTTPException, Query

from src.db.database import connection_scope
from src.modules.review_context.schemas import (
    ConvertGuidingQuestionRequest,
    ConvertedGuidingQuestionResponse,
    CreateReviewSessionInputRequest,
    CreateReviewSessionNodeRequest,
    CreateReviewSessionRequest,
    CreateTopicLinkRequest,
    CreateTopicRequest,
    ReviewGuidingQuestionRecord,
    ReviewSectionRecord,
    ReviewSessionDetailResponse,
    ReviewSessionInputRecord,
    ReviewSessionRecord,
    ReviewSessionNodeResponse,
    TopicLinkRecord,
    TopicRecord,
    UpdateGuidingQuestionStatusRequest,
    UpdateReviewSectionRequest,
    UpdateReviewSessionRequest,
    UpdateTopicRequest,
)
from src.modules.review_context.service import (
    ReviewGuidingQuestionNotFoundError,
    ReviewSectionNotFoundError,
    ReviewSessionInputNotFoundError,
    ReviewSessionNotFoundError,
    TopicLinkNotFoundError,
    ReviewValidationError,
    TopicNotFoundError,
    convert_guiding_question_to_node,
    create_review_session,
    create_review_session_input,
    create_review_session_node,
    create_topic,
    create_topic_link,
    delete_review_session_input,
    delete_topic_link,
    ensure_current_monthly_review_session,
    generate_guiding_questions,
    get_review_session_detail,
    get_topic,
    list_guiding_questions,
    list_review_session_inputs,
    list_review_sessions_for_topic,
    list_topics,
    list_topic_links,
    list_topic_links_for_target,
    update_guiding_question_status,
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


@router.post("/topics/{topic_id}/links", response_model=TopicLinkRecord)
def post_topic_link(topic_id: str, payload: CreateTopicLinkRequest) -> dict:
    with connection_scope() as conn:
        try:
            return create_topic_link(conn, topic_id, payload.target_type, payload.target_id)
        except TopicNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            status_code = 409 if "duplicate" in str(exc) else 400
            raise HTTPException(status_code=status_code, detail=str(exc)) from exc


@router.get("/topics/{topic_id}/links", response_model=list[TopicLinkRecord])
def get_topic_links(topic_id: str) -> list[dict]:
    with connection_scope() as conn:
        try:
            return list_topic_links(conn, topic_id)
        except TopicNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/topic-links", response_model=list[TopicLinkRecord])
def get_topic_links_for_target(target_type: str = Query(...), target_id: str = Query(...)) -> list[dict]:
    with connection_scope() as conn:
        try:
            return list_topic_links_for_target(conn, target_type, target_id)
        except ReviewValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/topic-links/{link_id}", status_code=204)
def delete_topic_link_route(link_id: str) -> None:
    with connection_scope() as conn:
        try:
            delete_topic_link(conn, link_id)
        except TopicLinkNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/topics/{topic_id}/review-sessions/ensure-current", response_model=ReviewSessionDetailResponse)
def post_ensure_current_review_session(topic_id: str) -> dict:
    with connection_scope() as conn:
        try:
            return ensure_current_monthly_review_session(conn, topic_id)
        except TopicNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/topics/{topic_id}/review-sessions", response_model=list[ReviewSessionRecord])
def get_review_sessions_for_topic(topic_id: str) -> list[dict]:
    with connection_scope() as conn:
        try:
            return list_review_sessions_for_topic(conn, topic_id)
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
        except ReviewValidationError as exc:
            status_code = 409 if "duplicate" in str(exc) else 400
            raise HTTPException(status_code=status_code, detail=str(exc)) from exc


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


@router.get("/review-sessions/{session_id}/inputs", response_model=list[ReviewSessionInputRecord])
def get_review_session_inputs(session_id: str) -> list[dict]:
    with connection_scope() as conn:
        try:
            return list_review_session_inputs(conn, session_id)
        except ReviewSessionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/review-sessions/{session_id}/inputs", response_model=ReviewSessionInputRecord)
def post_review_session_input(session_id: str, payload: CreateReviewSessionInputRequest) -> dict:
    with connection_scope() as conn:
        try:
            return create_review_session_input(conn, session_id, payload.target_type, payload.target_id, payload.source)
        except ReviewSessionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            status_code = 409 if "duplicate" in str(exc) else 400
            raise HTTPException(status_code=status_code, detail=str(exc)) from exc


@router.delete("/review-sessions/{session_id}/inputs/{input_id}", status_code=204)
def delete_review_session_input_route(session_id: str, input_id: str) -> None:
    with connection_scope() as conn:
        try:
            delete_review_session_input(conn, session_id, input_id)
        except (ReviewSessionNotFoundError, ReviewSessionInputNotFoundError) as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/review-sessions/{session_id}/guiding-questions/generate",
    response_model=list[ReviewGuidingQuestionRecord],
)
def post_generate_guiding_questions(session_id: str) -> list[dict]:
    with connection_scope() as conn:
        try:
            return generate_guiding_questions(conn, session_id)
        except ReviewSessionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/review-sessions/{session_id}/guiding-questions", response_model=list[ReviewGuidingQuestionRecord])
def get_guiding_questions(session_id: str) -> list[dict]:
    with connection_scope() as conn:
        try:
            return list_guiding_questions(conn, session_id)
        except ReviewSessionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/review-guiding-questions/{question_id}/status", response_model=ReviewGuidingQuestionRecord)
def patch_guiding_question_status(question_id: str, payload: UpdateGuidingQuestionStatusRequest) -> dict:
    with connection_scope() as conn:
        try:
            return update_guiding_question_status(conn, question_id, payload.status)
        except ReviewGuidingQuestionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/review-guiding-questions/{question_id}/convert-to-node",
    response_model=ConvertedGuidingQuestionResponse,
)
def post_convert_guiding_question(
    question_id: str,
    payload: ConvertGuidingQuestionRequest | None = None,
) -> dict:
    with connection_scope() as conn:
        try:
            return convert_guiding_question_to_node(conn, question_id, payload.initial_note if payload else None)
        except ReviewGuidingQuestionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/review-sessions/{session_id}/nodes", response_model=ReviewSessionNodeResponse)
def post_review_session_node(session_id: str, payload: CreateReviewSessionNodeRequest) -> dict:
    with connection_scope() as conn:
        try:
            return create_review_session_node(conn, session_id, payload.question, payload.title)
        except ReviewSessionNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ReviewValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
