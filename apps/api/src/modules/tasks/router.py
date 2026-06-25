from fastapi import APIRouter, HTTPException

from src.db.database import connection_scope
from src.modules.tasks.schemas import (
    CreateTaskRequest,
    TaskRecord,
    UpdateTaskReminderRequest,
    UpdateTaskStatusRequest,
)
from src.modules.tasks.service import (
    InvalidTaskStatusTransitionError,
    TaskNodeNotFoundError,
    TaskNotFoundError,
    advance_due_reminders,
    create_task,
    update_task_reminder,
    update_task_status,
)


router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskRecord)
def post_task(payload: CreateTaskRequest) -> dict:
    with connection_scope() as conn:
        try:
            return create_task(
                conn,
                payload.node_id,
                payload.task_type,
                payload.source_type,
                payload.content,
                payload.next_remind_at,
            )
        except TaskNodeNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/reminder/run", response_model=list[TaskRecord])
def post_reminder_run() -> list[dict]:
    with connection_scope() as conn:
        return advance_due_reminders(conn)


@router.patch("/{task_id}/status", response_model=TaskRecord)
def patch_task_status(task_id: str, payload: UpdateTaskStatusRequest) -> dict:
    with connection_scope() as conn:
        try:
            return update_task_status(conn, task_id, payload.status)
        except TaskNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except InvalidTaskStatusTransitionError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{task_id}/reminder", response_model=TaskRecord)
def patch_task_reminder(task_id: str, payload: UpdateTaskReminderRequest) -> dict:
    with connection_scope() as conn:
        try:
            return update_task_reminder(
                conn,
                task_id,
                payload.remind_count,
                payload.last_remind_at,
                payload.next_remind_at,
            )
        except TaskNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except InvalidTaskStatusTransitionError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
