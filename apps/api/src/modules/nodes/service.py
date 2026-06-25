import json
import re
import sqlite3
import uuid
from typing import Optional

from src.shared.constants import EXTRACTION_VERSION
from src.shared.time import now_iso, today_at_21_iso


class NodeNotFoundError(Exception):
    pass


class InvalidStageProgressionError(Exception):
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
    from src.modules.discovery.service import run_discovery_for_spark

    run_discovery_for_spark(conn, node_id)
    return get_node_detail(conn, node_id)


STAGE_PROGRESSION = {
    "spark": ("reasoning", "reasoning"),
    "reasoning": ("decision_prep", "decision_prep"),
    "decision_prep": ("decision", "decision"),
}


def progress_node(conn: sqlite3.Connection, node_id: str, content: str, title: Optional[str] = None) -> dict:
    source_node = conn.execute("SELECT * FROM node WHERE id = ?", (node_id,)).fetchone()
    if source_node is None:
        raise NodeNotFoundError("Node not found")

    current_type = source_node["node_type"]
    if current_type not in STAGE_PROGRESSION:
        raise InvalidStageProgressionError("Node cannot progress from current stage")

    next_type, message_type = STAGE_PROGRESSION[current_type]
    timestamp = now_iso()
    new_node_id = _new_id()
    message_id = _new_id()
    interpretation_id = _new_id()
    relation_id = _new_id()
    node_title = make_title(content, title)
    entities_json, keywords_json = extract_interpretation(content)

    conn.execute(
        """
        INSERT INTO node (id, node_type, title, lifecycle_status, created_at, updated_at, archived_at)
        VALUES (?, ?, ?, 'open', ?, ?, NULL)
        """,
        (new_node_id, next_type, node_title, timestamp, timestamp),
    )
    conn.execute(
        """
        INSERT INTO node_message (id, node_id, role, content, message_type, created_at)
        VALUES (?, ?, 'user', ?, ?, ?)
        """,
        (message_id, new_node_id, content, message_type, timestamp),
    )
    conn.execute(
        """
        INSERT INTO node_interpretation (
          id, node_id, entities_json, keywords_json, extraction_version, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (interpretation_id, new_node_id, entities_json, keywords_json, EXTRACTION_VERSION, timestamp),
    )
    conn.execute(
        """
        INSERT INTO relation (
          id, source_node_id, target_node_id, relation_type, relation_reason, status, created_by, created_at
        )
        VALUES (?, ?, ?, 'derived_from', ?, 'confirmed', 'user', ?)
        """,
        (relation_id, new_node_id, node_id, "Stage progression", timestamp),
    )
    return get_node_detail(conn, new_node_id)


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
    relations = conn.execute(
        """
        SELECT * FROM relation
        WHERE source_node_id = ? OR target_node_id = ?
        ORDER BY created_at ASC
        """,
        (node_id, node_id),
    ).fetchall()
    evidence = conn.execute(
        """
        SELECT * FROM evidence
        WHERE target_type = 'node' AND target_id = ?
        ORDER BY created_at DESC
        """,
        (node_id,),
    ).fetchall()

    return {
        "node": dict(node),
        "messages": [dict(row) for row in messages],
        "latest_interpretation": _row_to_dict(interpretation),
        "tasks": [dict(row) for row in tasks],
        "relations": [dict(row) for row in relations],
        "evidence": [dict(row) for row in evidence],
    }


def archive_node(conn: sqlite3.Connection, node_id: str) -> dict:
    node = conn.execute("SELECT * FROM node WHERE id = ?", (node_id,)).fetchone()
    if node is None:
        raise NodeNotFoundError("Node not found")
    timestamp = now_iso()
    conn.execute(
        """
        UPDATE node
        SET lifecycle_status = 'archived',
            archived_at = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (timestamp, timestamp, node_id),
    )
    updated = conn.execute("SELECT * FROM node WHERE id = ?", (node_id,)).fetchone()
    return dict(updated)


def list_workspace_nodes(conn: sqlite3.Connection, workspace_filter: str) -> list[dict]:
    if workspace_filter == "inbox":
        rows = conn.execute(
            """
            SELECT DISTINCT n.*
            FROM node n
            JOIN task t ON t.node_id = n.id
            WHERE t.status = 'pending'
              AND n.lifecycle_status != 'archived'
            ORDER BY n.updated_at DESC
            """
        ).fetchall()
    elif workspace_filter == "active":
        rows = conn.execute(
            """
            SELECT DISTINCT n.*
            FROM node n
            LEFT JOIN task t ON t.node_id = n.id AND t.status = 'pending'
            WHERE n.lifecycle_status != 'archived'
              AND (
                (n.lifecycle_status = 'open' AND n.node_type IN ('reasoning', 'decision_prep'))
                OR t.id IS NOT NULL
              )
            ORDER BY n.updated_at DESC
            """
        ).fetchall()
    elif workspace_filter == "decision":
        rows = conn.execute(
            """
            SELECT *
            FROM node
            WHERE lifecycle_status != 'archived'
              AND node_type IN ('decision_prep', 'decision')
            ORDER BY updated_at DESC
            """
        ).fetchall()
    elif workspace_filter == "all":
        rows = conn.execute(
            """
            SELECT *
            FROM node
            WHERE lifecycle_status != 'archived'
            ORDER BY updated_at DESC
            """
        ).fetchall()
    else:
        raise ValueError("Invalid workspace filter")

    items = []
    for row in rows:
        node_id = row["id"]
        latest_message = conn.execute(
            """
            SELECT * FROM node_message
            WHERE node_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (node_id,),
        ).fetchone()
        pending_tasks = conn.execute(
            """
            SELECT * FROM task
            WHERE node_id = ? AND status = 'pending'
            ORDER BY created_at ASC
            """,
            (node_id,),
        ).fetchall()
        items.append(
            {
                "node": dict(row),
                "latest_message": _row_to_dict(latest_message),
                "pending_tasks": [dict(task) for task in pending_tasks],
            }
        )
    return items
