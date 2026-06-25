import sqlite3
import uuid
from typing import Optional

from src.shared.time import add_days_iso, now_datetime, now_iso, today_at_21_iso


class TaskNotFoundError(Exception):
    pass


class TaskNodeNotFoundError(Exception):
    pass


class InvalidTaskStatusTransitionError(Exception):
    pass


def _new_id() -> str:
    return str(uuid.uuid4())


def _ensure_node_exists(conn: sqlite3.Connection, node_id: str) -> None:
    row = conn.execute("SELECT id FROM node WHERE id = ?", (node_id,)).fetchone()
    if row is None:
        raise TaskNodeNotFoundError("Task node target not found")


def create_task(
    conn: sqlite3.Connection,
    node_id: str,
    task_type: str,
    source_type: str,
    content: str,
    next_remind_at: Optional[str] = None,
) -> dict:
    _ensure_node_exists(conn, node_id)
    timestamp = now_iso()
    task_id = _new_id()
    conn.execute(
        """
        INSERT INTO task (
          id, node_id, task_type, source_type, content, status, remind_count,
          last_remind_at, next_remind_at, archived_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL, ?, NULL, ?, ?)
        """,
        (task_id, node_id, task_type, source_type, content, next_remind_at or today_at_21_iso(), timestamp, timestamp),
    )
    row = conn.execute("SELECT * FROM task WHERE id = ?", (task_id,)).fetchone()
    return dict(row)


ALLOWED_TRANSITIONS = {
    "pending": {"completed", "sleeping"},
    "sleeping": {"pending", "completed"},
    "completed": set(),
}


def update_task_status(conn: sqlite3.Connection, task_id: str, status: str) -> dict:
    row = conn.execute("SELECT * FROM task WHERE id = ?", (task_id,)).fetchone()
    if row is None:
        raise TaskNotFoundError("Task not found")

    current_status = row["status"]
    if status == current_status:
        return dict(row)
    if status not in ALLOWED_TRANSITIONS[current_status]:
        raise InvalidTaskStatusTransitionError("Invalid task status transition")

    timestamp = now_iso()
    next_remind_at = None if status in {"sleeping", "completed"} else row["next_remind_at"]
    conn.execute(
        """
        UPDATE task
        SET status = ?, next_remind_at = ?, updated_at = ?
        WHERE id = ?
        """,
        (status, next_remind_at, timestamp, task_id),
    )
    updated = conn.execute("SELECT * FROM task WHERE id = ?", (task_id,)).fetchone()
    return dict(updated)


def update_task_reminder(
    conn: sqlite3.Connection,
    task_id: str,
    remind_count: Optional[int],
    last_remind_at: Optional[str],
    next_remind_at: Optional[str],
) -> dict:
    row = conn.execute("SELECT * FROM task WHERE id = ?", (task_id,)).fetchone()
    if row is None:
        raise TaskNotFoundError("Task not found")
    if row["status"] == "completed":
        raise InvalidTaskStatusTransitionError("Completed tasks cannot be reopened or rescheduled")

    timestamp = now_iso()
    conn.execute(
        """
        UPDATE task
        SET remind_count = COALESCE(?, remind_count),
            last_remind_at = COALESCE(?, last_remind_at),
            next_remind_at = COALESCE(?, next_remind_at),
            updated_at = ?
        WHERE id = ?
        """,
        (remind_count, last_remind_at, next_remind_at, timestamp, task_id),
    )
    updated = conn.execute("SELECT * FROM task WHERE id = ?", (task_id,)).fetchone()
    return dict(updated)


def advance_due_reminders(conn: sqlite3.Connection) -> list[dict]:
    now = now_datetime()
    now_text = now.isoformat()
    due_tasks = conn.execute(
        """
        SELECT * FROM task
        WHERE status = 'pending'
          AND next_remind_at IS NOT NULL
          AND next_remind_at <= ?
        ORDER BY next_remind_at ASC
        """,
        (now_text,),
    ).fetchall()
    updated_tasks = []
    for task in due_tasks:
        remind_count = task["remind_count"] + 1
        if remind_count == 1:
            status = "pending"
            next_remind_at = add_days_iso(now_text, 7)
        elif remind_count == 2:
            status = "pending"
            next_remind_at = add_days_iso(now_text, 30)
        else:
            status = "sleeping"
            next_remind_at = None

        conn.execute(
            """
            UPDATE task
            SET status = ?,
                remind_count = ?,
                last_remind_at = ?,
                next_remind_at = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (status, remind_count, now_text, next_remind_at, now_text, task["id"]),
        )
        updated = conn.execute("SELECT * FROM task WHERE id = ?", (task["id"],)).fetchone()
        updated_tasks.append(dict(updated))
    return updated_tasks
