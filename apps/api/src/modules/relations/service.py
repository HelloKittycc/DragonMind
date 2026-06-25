import sqlite3
import uuid
from typing import Optional

from src.modules.discovery.service import revive_sleeping_tasks_for_nodes
from src.shared.time import now_iso


class RelationNotFoundError(Exception):
    pass


class RelationConflictError(Exception):
    pass


class InvalidRelationStatusTransitionError(Exception):
    pass


class RelationTargetNotFoundError(Exception):
    pass


def _new_id() -> str:
    return str(uuid.uuid4())


def normalize_relation_pair(source_node_id: str, target_node_id: str, relation_type: str) -> tuple[str, str]:
    if relation_type != "related":
        return source_node_id, target_node_id
    return tuple(sorted([source_node_id, target_node_id]))


def _ensure_node_exists(conn: sqlite3.Connection, node_id: str) -> None:
    row = conn.execute("SELECT id FROM node WHERE id = ?", (node_id,)).fetchone()
    if row is None:
        raise RelationTargetNotFoundError("Relation node target not found")


def create_relation(
    conn: sqlite3.Connection,
    source_node_id: str,
    target_node_id: str,
    relation_type: str,
    relation_reason: str,
    status: Optional[str],
    created_by: str,
) -> dict:
    source_node_id, target_node_id = normalize_relation_pair(
        source_node_id, target_node_id, relation_type
    )
    if source_node_id == target_node_id:
        raise RelationConflictError("Relation cannot target the same Node")

    _ensure_node_exists(conn, source_node_id)
    _ensure_node_exists(conn, target_node_id)

    relation_status = status or ("confirmed" if created_by == "user" else "suggested")
    relation_id = _new_id()
    timestamp = now_iso()
    try:
        conn.execute(
            """
            INSERT INTO relation (
              id, source_node_id, target_node_id, relation_type,
              relation_reason, status, created_by, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                relation_id,
                source_node_id,
                target_node_id,
                relation_type,
                relation_reason,
                relation_status,
                created_by,
                timestamp,
            ),
        )
    except sqlite3.IntegrityError as exc:
        raise RelationConflictError("Active relation already exists") from exc

    revive_sleeping_tasks_for_nodes(conn, [source_node_id, target_node_id])
    row = conn.execute("SELECT * FROM relation WHERE id = ?", (relation_id,)).fetchone()
    return dict(row)


def update_relation_status(conn: sqlite3.Connection, relation_id: str, status: str) -> dict:
    row = conn.execute("SELECT * FROM relation WHERE id = ?", (relation_id,)).fetchone()
    if row is None:
        raise RelationNotFoundError("Relation not found")
    if row["status"] != "suggested":
        raise InvalidRelationStatusTransitionError("Only suggested relations can change status")
    if status not in {"confirmed", "dismissed"}:
        raise InvalidRelationStatusTransitionError("Invalid relation status")

    try:
        conn.execute("UPDATE relation SET status = ? WHERE id = ?", (status, relation_id))
    except sqlite3.IntegrityError as exc:
        raise RelationConflictError("Active relation already exists") from exc
    updated = conn.execute("SELECT * FROM relation WHERE id = ?", (relation_id,)).fetchone()
    return dict(updated)
