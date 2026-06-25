import json
import re
import sqlite3
import uuid
from typing import Optional

from src.shared.constants import EXTRACTION_VERSION
from src.shared.time import now_iso, today_at_21_iso


class NodeNotFoundError(Exception):
    pass


def _new_id() -> str:
    return str(uuid.uuid4())


def _row_to_dict(row: Optional[sqlite3.Row]) -> Optional[dict]:
    return dict(row) if row is not None else None


def make_title(content: str, title: Optional[str] = None) -> str:
    if title:
        return title.strip()
    first_line = content.strip().splitlines()[0]
    return first_line[:80]


def extract_interpretation(content: str) -> tuple[str, str]:
    words = re.findall(r"[A-Za-z0-9_\-\u4e00-\u9fff]+", content)
    keywords = []
    for word in words:
        normalized = word.strip()
        if len(normalized) < 2:
            continue
        if normalized not in keywords:
            keywords.append(normalized)
    entities = [word for word in keywords if re.match(r"^[A-Z][A-Za-z0-9_\-]+$", word)]
    return json.dumps(entities[:20], ensure_ascii=False), json.dumps(keywords[:40], ensure_ascii=False)


def create_spark(conn: sqlite3.Connection, content: str, title: Optional[str] = None) -> dict:
    timestamp = now_iso()
    node_id = _new_id()
    message_id = _new_id()
    interpretation_id = _new_id()
    task_id = _new_id()
    node_title = make_title(content, title)
    entities_json, keywords_json = extract_interpretation(content)

    conn.execute(
        """
        INSERT INTO node (id, node_type, title, lifecycle_status, created_at, updated_at, archived_at)
        VALUES (?, 'spark', ?, 'open', ?, ?, NULL)
        """,
        (node_id, node_title, timestamp, timestamp),
    )
    conn.execute(
        """
        INSERT INTO node_message (id, node_id, role, content, message_type, created_at)
        VALUES (?, ?, 'user', ?, 'original', ?)
        """,
        (message_id, node_id, content, timestamp),
    )
    conn.execute(
        """
        INSERT INTO node_interpretation (
          id, node_id, entities_json, keywords_json, extraction_version, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (interpretation_id, node_id, entities_json, keywords_json, EXTRACTION_VERSION, timestamp),
    )
    conn.execute(
        """
        INSERT INTO task (
          id, node_id, task_type, source_type, content, status, remind_count,
          last_remind_at, next_remind_at, archived_at, created_at, updated_at
        )
        VALUES (?, ?, 'spark_follow_up', 'spark', ?, 'pending', 0, NULL, ?, NULL, ?, ?)
        """,
        (task_id, node_id, "Follow up on this Spark.", today_at_21_iso(), timestamp, timestamp),
    )
    return get_node_detail(conn, node_id)


def append_message(
    conn: sqlite3.Connection,
    node_id: str,
    content: str,
    role: str,
    message_type: str,
) -> dict:
    node = conn.execute("SELECT id FROM node WHERE id = ?", (node_id,)).fetchone()
    if node is None:
        raise NodeNotFoundError("Node not found")

    timestamp = now_iso()
    message_id = _new_id()
    conn.execute(
        """
        INSERT INTO node_message (id, node_id, role, content, message_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (message_id, node_id, role, content, message_type, timestamp),
    )
    row = conn.execute("SELECT * FROM node_message WHERE id = ?", (message_id,)).fetchone()
    return dict(row)


def get_node_detail(conn: sqlite3.Connection, node_id: str) -> dict:
    node = conn.execute("SELECT * FROM node WHERE id = ?", (node_id,)).fetchone()
    if node is None:
        raise NodeNotFoundError("Node not found")

    messages = conn.execute(
        "SELECT * FROM node_message WHERE node_id = ? ORDER BY created_at ASC",
        (node_id,),
    ).fetchall()
    interpretation = conn.execute(
        """
        SELECT * FROM node_interpretation
        WHERE node_id = ?
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (node_id,),
    ).fetchone()
    tasks = conn.execute(
        "SELECT * FROM task WHERE node_id = ? ORDER BY created_at ASC",
        (node_id,),
    ).fetchall()

    return {
        "node": dict(node),
        "messages": [dict(row) for row in messages],
        "latest_interpretation": _row_to_dict(interpretation),
        "tasks": [dict(row) for row in tasks],
    }
