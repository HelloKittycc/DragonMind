import sqlite3
import uuid
from typing import Optional

from src.modules.discovery.service import revive_sleeping_tasks_for_nodes
from src.shared.time import now_iso


class EvidenceTargetNotFoundError(Exception):
    pass


def _new_id() -> str:
    return str(uuid.uuid4())


def _node_ids_for_target(conn: sqlite3.Connection, target_type: str, target_id: str) -> list[str]:
    if target_type == "node":
        row = conn.execute("SELECT id FROM node WHERE id = ?", (target_id,)).fetchone()
        if row is None:
            raise EvidenceTargetNotFoundError("Evidence node target not found")
        return [target_id]

    row = conn.execute("SELECT source_node_id, target_node_id FROM relation WHERE id = ?", (target_id,)).fetchone()
    if row is None:
        raise EvidenceTargetNotFoundError("Evidence relation target not found")
    return [row["source_node_id"], row["target_node_id"]]


def create_evidence(
    conn: sqlite3.Connection,
    target_type: str,
    target_id: str,
    evidence_type: str,
    stance: str,
    content: str,
    source: Optional[str],
    source_url: Optional[str],
    knowledge_chunk_id: Optional[str] = None,
) -> dict:
    related_node_ids = _node_ids_for_target(conn, target_type, target_id)
    if knowledge_chunk_id is not None:
        row = conn.execute("SELECT id FROM knowledge_chunk WHERE id = ?", (knowledge_chunk_id,)).fetchone()
        if row is None:
            raise EvidenceTargetNotFoundError("Evidence knowledge chunk source not found")
    evidence_id = _new_id()
    timestamp = now_iso()
    conn.execute(
        """
        INSERT INTO evidence (
          id, target_type, target_id, evidence_type, stance, content, source, source_url, knowledge_chunk_id, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            evidence_id,
            target_type,
            target_id,
            evidence_type,
            stance,
            content,
            source,
            source_url,
            knowledge_chunk_id,
            timestamp,
        ),
    )
    revive_sleeping_tasks_for_nodes(conn, related_node_ids)
    row = conn.execute("SELECT * FROM evidence WHERE id = ?", (evidence_id,)).fetchone()
    return dict(row)


def list_evidence(conn: sqlite3.Connection, target_type: str, target_id: str) -> list[dict]:
    _node_ids_for_target(conn, target_type, target_id)
    rows = conn.execute(
        """
        SELECT * FROM evidence
        WHERE target_type = ? AND target_id = ?
        ORDER BY created_at DESC
        """,
        (target_type, target_id),
    ).fetchall()
    return [dict(row) for row in rows]
