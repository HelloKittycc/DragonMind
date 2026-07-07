import sqlite3
import uuid
from typing import Optional

from src.shared.constants import DEFAULT_REVIEW_SECTIONS
from src.shared.time import now_iso


class TopicNotFoundError(Exception):
    pass


class ReviewSessionNotFoundError(Exception):
    pass


class ReviewSectionNotFoundError(Exception):
    pass


class ReviewValidationError(Exception):
    pass


def _new_id() -> str:
    return str(uuid.uuid4())


def _row_to_dict(row: Optional[sqlite3.Row]) -> Optional[dict]:
    return dict(row) if row is not None else None


def _get_topic(conn: sqlite3.Connection, topic_id: str) -> dict:
    row = conn.execute("SELECT * FROM topic WHERE id = ?", (topic_id,)).fetchone()
    if row is None:
        raise TopicNotFoundError("Topic not found")
    return dict(row)


def create_topic(
    conn: sqlite3.Connection,
    title: str,
    description: Optional[str],
    status: str,
    review_cadence: Optional[str],
    next_review_at: Optional[str],
) -> dict:
    timestamp = now_iso()
    topic_id = _new_id()
    conn.execute(
        """
        INSERT INTO topic (
          id, title, description, status, review_cadence, next_review_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (topic_id, title, description, status, review_cadence, next_review_at, timestamp, timestamp),
    )
    return _get_topic(conn, topic_id)


def list_topics(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute(
        """
        SELECT * FROM topic
        ORDER BY updated_at DESC, created_at DESC
        """
    ).fetchall()
    return [dict(row) for row in rows]


def get_topic(conn: sqlite3.Connection, topic_id: str) -> dict:
    return _get_topic(conn, topic_id)


def update_topic(
    conn: sqlite3.Connection,
    topic_id: str,
    title: Optional[str],
    description: Optional[str],
    status: Optional[str],
    review_cadence: Optional[str],
    next_review_at: Optional[str],
) -> dict:
    _get_topic(conn, topic_id)
    updates: list[str] = []
    params: list[object] = []
    for field_name, value in [
        ("title", title),
        ("description", description),
        ("status", status),
        ("review_cadence", review_cadence),
        ("next_review_at", next_review_at),
    ]:
        if value is not None:
            updates.append(f"{field_name} = ?")
            params.append(value)
    if not updates:
        return _get_topic(conn, topic_id)
    timestamp = now_iso()
    updates.append("updated_at = ?")
    params.extend([timestamp, topic_id])
    conn.execute(
        f"""
        UPDATE topic
        SET {', '.join(updates)}
        WHERE id = ?
        """,
        params,
    )
    return _get_topic(conn, topic_id)


def _get_session_row(conn: sqlite3.Connection, session_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM review_session WHERE id = ?", (session_id,)).fetchone()
    if row is None:
        raise ReviewSessionNotFoundError("Review Session not found")
    return row


def create_review_session(
    conn: sqlite3.Connection,
    primary_topic_id: str,
    title: str,
    period_start: str,
    period_end: str,
    status: str,
) -> dict:
    _get_topic(conn, primary_topic_id)
    timestamp = now_iso()
    session_id = _new_id()
    completed_at = timestamp if status == "completed" else None
    conn.execute(
        """
        INSERT INTO review_session (
          id, primary_topic_id, title, period_start, period_end, status,
          created_at, updated_at, completed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (session_id, primary_topic_id, title, period_start, period_end, status, timestamp, timestamp, completed_at),
    )
    _create_default_sections(conn, session_id, timestamp)
    return get_review_session_detail(conn, session_id)


def _create_default_sections(conn: sqlite3.Connection, session_id: str, timestamp: str) -> None:
    for sort_order, (section_type, title) in enumerate(DEFAULT_REVIEW_SECTIONS):
        conn.execute(
            """
            INSERT INTO review_section (
              id, session_id, section_type, title, content, sort_order, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, NULL, ?, ?, ?)
            """,
            (_new_id(), session_id, section_type, title, sort_order, timestamp, timestamp),
        )


def get_review_session_detail(conn: sqlite3.Connection, session_id: str) -> dict:
    session = _get_session_row(conn, session_id)
    return {
        "session": dict(session),
        "sections": _list_sections(conn, session_id),
    }


def _list_sections(conn: sqlite3.Connection, session_id: str) -> list[dict]:
    rows = conn.execute(
        """
        SELECT * FROM review_section
        WHERE session_id = ?
        ORDER BY sort_order ASC
        """,
        (session_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def update_review_session(
    conn: sqlite3.Connection,
    session_id: str,
    title: Optional[str],
    period_start: Optional[str],
    period_end: Optional[str],
    status: Optional[str],
) -> dict:
    current = _get_session_row(conn, session_id)
    if current["status"] == "completed":
        raise ReviewValidationError("completed Review Sessions are read-only")

    next_period_start = period_start if period_start is not None else current["period_start"]
    next_period_end = period_end if period_end is not None else current["period_end"]
    if next_period_start > next_period_end:
        raise ReviewValidationError("period_start cannot be after period_end")

    updates: list[str] = []
    params: list[object] = []
    for field_name, value in [
        ("title", title),
        ("period_start", period_start),
        ("period_end", period_end),
        ("status", status),
    ]:
        if value is not None:
            updates.append(f"{field_name} = ?")
            params.append(value)

    timestamp = now_iso()
    if status == "completed":
        updates.append("completed_at = ?")
        params.append(timestamp)

    if not updates:
        return get_review_session_detail(conn, session_id)

    updates.append("updated_at = ?")
    params.extend([timestamp, session_id])
    conn.execute(
        f"""
        UPDATE review_session
        SET {', '.join(updates)}
        WHERE id = ?
        """,
        params,
    )
    return get_review_session_detail(conn, session_id)


def update_review_section(conn: sqlite3.Connection, section_id: str, content: Optional[str]) -> dict:
    section = conn.execute("SELECT * FROM review_section WHERE id = ?", (section_id,)).fetchone()
    if section is None:
        raise ReviewSectionNotFoundError("Review Section not found")
    session = _get_session_row(conn, section["session_id"])
    if session["status"] == "completed":
        raise ReviewValidationError("completed Review Sessions are read-only")

    timestamp = now_iso()
    conn.execute(
        """
        UPDATE review_section
        SET content = ?, updated_at = ?
        WHERE id = ?
        """,
        (content, timestamp, section_id),
    )
    updated = conn.execute("SELECT * FROM review_section WHERE id = ?", (section_id,)).fetchone()
    return dict(updated)


def create_topic_link(
    conn: sqlite3.Connection,
    topic_id: str,
    target_type: str,
    target_id: str,
) -> dict:
    _get_topic(conn, topic_id)
    _validate_target_exists(conn, target_type, target_id)
    timestamp = now_iso()
    link_id = _new_id()
    try:
        conn.execute(
            """
            INSERT INTO topic_link (id, topic_id, target_type, target_id, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (link_id, topic_id, target_type, target_id, timestamp),
        )
    except sqlite3.IntegrityError as exc:
        raise ReviewValidationError("duplicate topic link") from exc
    row = conn.execute("SELECT * FROM topic_link WHERE id = ?", (link_id,)).fetchone()
    return dict(row)


def _validate_target_exists(conn: sqlite3.Connection, target_type: str, target_id: str) -> None:
    if target_type == "node":
        row = conn.execute("SELECT id FROM node WHERE id = ?", (target_id,)).fetchone()
    elif target_type == "knowledge_source":
        row = conn.execute("SELECT id FROM knowledge_source WHERE id = ?", (target_id,)).fetchone()
    else:
        raise ReviewValidationError("invalid review link target type")
    if row is None:
        raise ReviewValidationError("review link target not found")
