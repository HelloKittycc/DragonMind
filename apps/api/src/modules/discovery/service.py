import re
import sqlite3
import uuid

from src.shared.time import now_iso, today_at_21_iso


def _new_id() -> str:
    return str(uuid.uuid4())


def _tokens(text: str) -> set[str]:
    return {
        token.lower()
        for token in re.findall(r"[A-Za-z0-9_\-\u4e00-\u9fff]+", text)
        if len(token.strip()) >= 2
    }


def _latest_content(conn: sqlite3.Connection, node_id: str) -> str:
    row = conn.execute(
        """
        SELECT content FROM node_message
        WHERE node_id = ?
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (node_id,),
    ).fetchone()
    return row["content"] if row else ""


def _create_discovery_task(conn: sqlite3.Connection, node_id: str, content: str) -> None:
    timestamp = now_iso()
    conn.execute(
        """
        INSERT INTO task (
          id, node_id, task_type, source_type, content, status, remind_count,
          last_remind_at, next_remind_at, archived_at, created_at, updated_at
        )
        VALUES (?, ?, 'discovery_expand', 'discovery', ?, 'pending', 0, NULL, ?, NULL, ?, ?)
        """,
        (_new_id(), node_id, content, today_at_21_iso(), timestamp, timestamp),
    )


def _create_relation_if_absent(
    conn: sqlite3.Connection,
    source_node_id: str,
    target_node_id: str,
    relation_type: str,
    relation_reason: str,
) -> bool:
    if relation_type == "related":
        source_node_id, target_node_id = tuple(sorted([source_node_id, target_node_id]))
    try:
        conn.execute(
            """
            INSERT INTO relation (
              id, source_node_id, target_node_id, relation_type,
              relation_reason, status, created_by, created_at
            )
            VALUES (?, ?, ?, ?, ?, 'suggested', 'agent', ?)
            """,
            (_new_id(), source_node_id, target_node_id, relation_type, relation_reason, now_iso()),
        )
        return True
    except sqlite3.IntegrityError:
        return False


def revive_sleeping_tasks_for_nodes(conn: sqlite3.Connection, node_ids: list[str]) -> int:
    if not node_ids:
        return 0
    timestamp = now_iso()
    revived = 0
    for node_id in set(node_ids):
        cursor = conn.execute(
            """
            UPDATE task
            SET status = 'pending',
                remind_count = 0,
                last_remind_at = NULL,
                next_remind_at = ?,
                updated_at = ?
            WHERE node_id = ?
              AND status = 'sleeping'
            """,
            (today_at_21_iso(), timestamp, node_id),
        )
        revived += cursor.rowcount
    return revived


def run_discovery_for_spark(conn: sqlite3.Connection, node_id: str) -> dict:
    node = conn.execute("SELECT * FROM node WHERE id = ? AND node_type = 'spark'", (node_id,)).fetchone()
    if node is None:
        return {"relations_created": 0, "tasks_created": 0, "revived_tasks": 0}

    content = _latest_content(conn, node_id)
    node_tokens = _tokens(f"{node['title']} {content}")
    if not node_tokens:
        return {"relations_created": 0, "tasks_created": 0, "revived_tasks": 0}

    relations_created = 0
    tasks_created = 0
    related_nodes: list[str] = []
    spark_rows = conn.execute(
        """
        SELECT * FROM node
        WHERE node_type = 'spark'
          AND id != ?
          AND lifecycle_status != 'archived'
        """,
        (node_id,),
    ).fetchall()

    normalized_content = re.sub(r"\s+", " ", content.strip().lower())
    for other in spark_rows:
        other_content = _latest_content(conn, other["id"])
        other_tokens = _tokens(f"{other['title']} {other_content}")
        overlap = node_tokens.intersection(other_tokens)
        other_normalized = re.sub(r"\s+", " ", other_content.strip().lower())

        is_repeated = normalized_content == other_normalized or len(overlap) >= 4
        is_related = len(overlap) >= 2
        if not is_related and not is_repeated:
            continue

        reason = "Repeated Spark discovery" if is_repeated else "Related Spark discovery"
        if _create_relation_if_absent(conn, node_id, other["id"], "related", reason):
            relations_created += 1
            related_nodes.append(other["id"])
            task_content = "Review repeated Spark." if is_repeated else "Review related Spark."
            _create_discovery_task(conn, node_id, task_content)
            tasks_created += 1

        if _looks_contradictory(content, other_content) and _create_relation_if_absent(
            conn, node_id, other["id"], "contradicts", "Simple contradiction detection"
        ):
            relations_created += 1
            _create_discovery_task(conn, node_id, "Review possible contradiction.")
            tasks_created += 1

    if _looks_anomalous(content):
        _create_discovery_task(conn, node_id, "Review possible anomaly.")
        tasks_created += 1

    revived = revive_sleeping_tasks_for_nodes(conn, related_nodes)
    return {"relations_created": relations_created, "tasks_created": tasks_created, "revived_tasks": revived}


def _looks_contradictory(left: str, right: str) -> bool:
    negative_markers = {"not", "no", "never", "不能", "不是", "没有", "不"}
    left_tokens = _tokens(left)
    right_tokens = _tokens(right)
    if len(left_tokens.intersection(right_tokens)) < 2:
        return False
    return bool(left_tokens.intersection(negative_markers) ^ right_tokens.intersection(negative_markers))


def _looks_anomalous(content: str) -> bool:
    lowered = content.lower()
    return "anomaly" in lowered or "异常" in lowered or "反常" in lowered


def get_discovery_feed(conn: sqlite3.Connection) -> list[dict]:
    items: list[dict] = []
    pending_tasks = conn.execute(
        """
        SELECT t.*, n.title, n.node_type
        FROM task t
        JOIN node n ON n.id = t.node_id
        WHERE t.status = 'pending'
          AND n.lifecycle_status != 'archived'
        """
    ).fetchall()
    for task in pending_tasks:
        item_type = "pending_spark_follow_up" if task["task_type"] == "spark_follow_up" else "discovery_task"
        items.append(
            {
                "item_type": item_type,
                "node_id": task["node_id"],
                "task_id": task["id"],
                "relation_id": None,
                "evidence_id": None,
                "title": task["title"],
                "description": task["content"],
                "created_at": task["created_at"],
                "runtime_importance": _score_task(task),
            }
        )

    relations = conn.execute(
        """
        SELECT r.*, sn.title AS source_title, tn.title AS target_title
        FROM relation r
        JOIN node sn ON sn.id = r.source_node_id
        JOIN node tn ON tn.id = r.target_node_id
        WHERE r.status IN ('suggested', 'confirmed')
        """
    ).fetchall()
    for relation in relations:
        if relation["relation_type"] == "related":
            item_type = "related_sparks" if relation["relation_reason"] != "Repeated Spark discovery" else "repeated_sparks"
        elif relation["relation_type"] == "contradicts":
            item_type = "basic_contradiction"
        else:
            item_type = "relation"
        items.append(
            {
                "item_type": item_type,
                "node_id": relation["source_node_id"],
                "task_id": None,
                "relation_id": relation["id"],
                "evidence_id": None,
                "title": relation["source_title"],
                "description": f"{relation['relation_type']} {relation['target_title']}",
                "created_at": relation["created_at"],
                "runtime_importance": _score_relation(relation),
            }
        )

    evidence_rows = conn.execute(
        """
        SELECT * FROM evidence
        ORDER BY created_at DESC
        LIMIT 50
        """
    ).fetchall()
    for evidence in evidence_rows:
        items.append(
            {
                "item_type": "evidence",
                "node_id": evidence["target_id"] if evidence["target_type"] == "node" else None,
                "task_id": None,
                "relation_id": evidence["target_id"] if evidence["target_type"] == "relation" else None,
                "evidence_id": evidence["id"],
                "title": f"Evidence: {evidence['stance']}",
                "description": evidence["content"],
                "created_at": evidence["created_at"],
                "runtime_importance": 45,
            }
        )

    return sorted(items, key=lambda item: (item["runtime_importance"], item["created_at"]), reverse=True)


def _score_task(task: sqlite3.Row) -> int:
    score = 50
    if task["task_type"] == "spark_follow_up":
        score += 10
    if task["task_type"] == "discovery_expand":
        score += 20
    if task["node_type"] in {"reasoning", "decision_prep"}:
        score += 10
    return score


def _score_relation(relation: sqlite3.Row) -> int:
    score = 40
    if relation["relation_type"] == "contradicts":
        score += 30
    if relation["relation_type"] == "related":
        score += 15
    if relation["status"] == "suggested":
        score += 10
    if relation["relation_reason"] == "Repeated Spark discovery":
        score += 20
    return score
