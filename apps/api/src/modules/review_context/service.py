import sqlite3
import uuid
from calendar import monthrange
from datetime import date
from typing import Optional

from src.modules.nodes.service import extract_interpretation
from src.shared.constants import DEFAULT_REVIEW_SECTIONS, EXTRACTION_VERSION
from src.shared.time import now_iso


class TopicNotFoundError(Exception):
    pass


class ReviewSessionNotFoundError(Exception):
    pass


class ReviewSectionNotFoundError(Exception):
    pass


class TopicLinkNotFoundError(Exception):
    pass


class ReviewSessionInputNotFoundError(Exception):
    pass


class ReviewGuidingQuestionNotFoundError(Exception):
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
    duplicate = conn.execute(
        """
        SELECT id FROM review_session
        WHERE primary_topic_id = ? AND period_start = ? AND period_end = ?
        LIMIT 1
        """,
        (primary_topic_id, period_start, period_end),
    ).fetchone()
    if duplicate is not None:
        raise ReviewValidationError("duplicate review session period")

    timestamp = now_iso()
    session_id = _new_id()
    completed_at = timestamp if status == "completed" else None
    try:
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
    except sqlite3.IntegrityError as exc:
        raise ReviewValidationError("duplicate review session period") from exc
    _create_default_sections(conn, session_id, timestamp)
    return get_review_session_detail(conn, session_id)


def ensure_current_monthly_review_session(conn: sqlite3.Connection, topic_id: str) -> dict:
    topic = _get_topic(conn, topic_id)
    if topic["status"] != "active" or topic["review_cadence"] != "monthly":
        raise ReviewValidationError("only active monthly topics can ensure current review session")

    today = date.today()
    period_start = today.replace(day=1).isoformat()
    period_end = today.replace(day=monthrange(today.year, today.month)[1]).isoformat()
    existing = conn.execute(
        """
        SELECT id FROM review_session
        WHERE primary_topic_id = ? AND period_start = ? AND period_end = ?
        LIMIT 1
        """,
        (topic_id, period_start, period_end),
    ).fetchone()
    if existing is not None:
        return get_review_session_detail(conn, existing["id"])

    title_subject = topic["title"].replace("月度", "").strip() or topic["title"]
    title = f"{today.year} 年 {today.month} 月{title_subject}"
    return create_review_session(conn, topic_id, title, period_start, period_end, "active")


def list_review_sessions_for_topic(conn: sqlite3.Connection, topic_id: str) -> list[dict]:
    _get_topic(conn, topic_id)
    rows = conn.execute(
        """
        SELECT * FROM review_session
        WHERE primary_topic_id = ?
        ORDER BY period_start DESC, created_at DESC
        """,
        (topic_id,),
    ).fetchall()
    return [dict(row) for row in rows]


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


def list_topic_links(conn: sqlite3.Connection, topic_id: str) -> list[dict]:
    _get_topic(conn, topic_id)
    rows = conn.execute(
        """
        SELECT * FROM topic_link
        WHERE topic_id = ?
        ORDER BY created_at DESC
        """,
        (topic_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def list_topic_links_for_target(conn: sqlite3.Connection, target_type: str, target_id: str) -> list[dict]:
    _validate_target_exists(conn, target_type, target_id)
    rows = conn.execute(
        """
        SELECT * FROM topic_link
        WHERE target_type = ? AND target_id = ?
        ORDER BY created_at DESC
        """,
        (target_type, target_id),
    ).fetchall()
    return [dict(row) for row in rows]


def delete_topic_link(conn: sqlite3.Connection, link_id: str) -> None:
    row = conn.execute("SELECT id FROM topic_link WHERE id = ?", (link_id,)).fetchone()
    if row is None:
        raise TopicLinkNotFoundError("Topic link not found")
    conn.execute("DELETE FROM topic_link WHERE id = ?", (link_id,))


def _ensure_session_editable(row: sqlite3.Row) -> None:
    if row["status"] == "completed":
        raise ReviewValidationError("completed Review Sessions are read-only")


def create_review_session_input(
    conn: sqlite3.Connection,
    session_id: str,
    target_type: str,
    target_id: str,
    source: str,
) -> dict:
    session = _get_session_row(conn, session_id)
    _ensure_session_editable(session)
    _validate_target_exists(conn, target_type, target_id)
    timestamp = now_iso()
    input_id = _new_id()
    try:
        conn.execute(
            """
            INSERT INTO review_session_input (
              id, session_id, target_type, target_id, source, confirmed_at, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (input_id, session_id, target_type, target_id, source, timestamp, timestamp),
        )
    except sqlite3.IntegrityError as exc:
        raise ReviewValidationError("duplicate review session input") from exc
    row = conn.execute("SELECT * FROM review_session_input WHERE id = ?", (input_id,)).fetchone()
    return dict(row)


def list_review_session_inputs(conn: sqlite3.Connection, session_id: str) -> list[dict]:
    _get_session_row(conn, session_id)
    rows = conn.execute(
        """
        SELECT * FROM review_session_input
        WHERE session_id = ?
        ORDER BY created_at DESC
        """,
        (session_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def delete_review_session_input(conn: sqlite3.Connection, session_id: str, input_id: str) -> None:
    session = _get_session_row(conn, session_id)
    _ensure_session_editable(session)
    row = conn.execute(
        """
        SELECT * FROM review_session_input
        WHERE id = ? AND session_id = ?
        """,
        (input_id, session_id),
    ).fetchone()
    if row is None:
        raise ReviewSessionInputNotFoundError("Review Session input not found")
    conn.execute("DELETE FROM review_session_input WHERE id = ?", (input_id,))


def generate_guiding_questions(conn: sqlite3.Connection, session_id: str) -> list[dict]:
    session = _get_session_row(conn, session_id)
    _ensure_session_editable(session)
    candidates = _build_guiding_question_candidates(conn, session_id)
    timestamp = now_iso()
    for question, rationale in candidates:
        existing = conn.execute(
            """
            SELECT id FROM review_guiding_question
            WHERE session_id = ? AND question = ?
            LIMIT 1
            """,
            (session_id, question),
        ).fetchone()
        if existing is not None:
            continue
        conn.execute(
            """
            INSERT INTO review_guiding_question (
              id, session_id, question, rationale, status, created_node_id, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, 'suggested', NULL, ?, ?)
            """,
            (_new_id(), session_id, question, rationale, timestamp, timestamp),
        )
    return list_guiding_questions(conn, session_id)


def list_guiding_questions(conn: sqlite3.Connection, session_id: str) -> list[dict]:
    _get_session_row(conn, session_id)
    rows = conn.execute(
        """
        SELECT * FROM review_guiding_question
        WHERE session_id = ?
        ORDER BY created_at ASC
        """,
        (session_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def _build_guiding_question_candidates(conn: sqlite3.Connection, session_id: str) -> list[tuple[str, str]]:
    sections = conn.execute(
        """
        SELECT title, content
        FROM review_section
        WHERE session_id = ? AND content IS NOT NULL AND TRIM(content) != ''
        ORDER BY sort_order ASC
        """,
        (session_id,),
    ).fetchall()
    inputs = _get_confirmed_input_sources(conn, session_id)
    if not sections and not inputs:
        return []

    candidates: list[tuple[str, str]] = []
    section_text = "\n".join(f"{row['title']}：{row['content']}" for row in sections)
    input_titles = "；".join(item["title"] for item in inputs[:4])

    if _contains_any(section_text, ["偏差", "下降", "低于", "异常", "未达成"]):
        source = _first_matching_section(sections, ["偏差", "下降", "低于", "异常", "未达成"])
        candidates.append(
            (
                "这些偏差或异常的主要原因是否已经明确？",
                f"来自复盘区块「{source['title']}」：{_excerpt(source['content'])}",
            )
        )

    channel_source = _first_source_matching(inputs, ["渠道", "转化"])
    if channel_source is not None:
        candidates.append(
            (
                "渠道相关变化是否已经成为需要持续追踪的趋势？",
                f"来自已纳入{channel_source['label']}「{channel_source['title']}」。",
            )
        )

    plan_source = _first_source_matching(inputs, ["计划", "复盘", "目标"])
    if plan_source is not None or _contains_any(section_text, ["计划", "目标", "下期"]):
        if plan_source is not None:
            rationale = f"来自已纳入{plan_source['label']}「{plan_source['title']}」。"
        else:
            source = _first_matching_section(sections, ["计划", "目标", "下期"])
            rationale = f"来自复盘区块「{source['title']}」：{_excerpt(source['content'])}"
        candidates.append(("下期计划是否有足够证据支持优先级？", rationale))

    node_inputs = [item for item in inputs if item["target_type"] == "node"]
    if len(node_inputs) >= 2:
        titles = "；".join(item["title"] for item in node_inputs[:3])
        candidates.append(("这些已纳入线索是否指向同一个核心问题？", f"来自已纳入线索：{titles}。"))

    if not candidates and input_titles:
        candidates.append(("这些已纳入材料中，最需要先判断的问题是什么？", f"来自已纳入输入：{input_titles}。"))

    deduped: list[tuple[str, str]] = []
    seen: set[str] = set()
    for question, rationale in candidates:
        if question in seen:
            continue
        seen.add(question)
        deduped.append((question, rationale))
    return deduped


def _get_confirmed_input_sources(conn: sqlite3.Connection, session_id: str) -> list[dict]:
    rows = conn.execute(
        """
        SELECT * FROM review_session_input
        WHERE session_id = ?
        ORDER BY created_at ASC
        """,
        (session_id,),
    ).fetchall()
    sources: list[dict] = []
    for row in rows:
        if row["target_type"] == "node":
            target = conn.execute("SELECT title FROM node WHERE id = ?", (row["target_id"],)).fetchone()
            label = "线索"
        elif row["target_type"] == "knowledge_source":
            target = conn.execute("SELECT title FROM knowledge_source WHERE id = ?", (row["target_id"],)).fetchone()
            label = "资料"
        else:
            target = None
            label = "输入"
        if target is None:
            continue
        sources.append(
            {
                "target_type": row["target_type"],
                "target_id": row["target_id"],
                "title": target["title"],
                "label": label,
            }
        )
    return sources


def _contains_any(content: str, keywords: list[str]) -> bool:
    return any(keyword in content for keyword in keywords)


def _first_matching_section(rows: list[sqlite3.Row], keywords: list[str]) -> sqlite3.Row:
    for row in rows:
        if _contains_any(f"{row['title']}\n{row['content']}", keywords):
            return row
    return rows[0]


def _first_source_matching(sources: list[dict], keywords: list[str]) -> Optional[dict]:
    for source in sources:
        if _contains_any(source["title"], keywords):
            return source
    return None


def _excerpt(content: str, limit: int = 80) -> str:
    normalized = " ".join(content.split())
    if len(normalized) <= limit:
        return normalized
    return normalized[:limit] + "..."


def update_guiding_question_status(conn: sqlite3.Connection, question_id: str, status: str) -> dict:
    question = _get_guiding_question_row(conn, question_id)
    session = _get_session_row(conn, question["session_id"])
    _ensure_session_editable(session)
    if status != "dismissed":
        raise ReviewValidationError("guiding question status can only be patched to dismissed")
    if question["status"] != "suggested":
        raise ReviewValidationError("only suggested guiding questions can be dismissed")
    timestamp = now_iso()
    conn.execute(
        """
        UPDATE review_guiding_question
        SET status = 'dismissed', updated_at = ?
        WHERE id = ?
        """,
        (timestamp, question_id),
    )
    return dict(_get_guiding_question_row(conn, question_id))


def convert_guiding_question_to_node(
    conn: sqlite3.Connection,
    question_id: str,
    initial_note: Optional[str] = None,
) -> dict:
    question = _get_guiding_question_row(conn, question_id)
    session = _get_session_row(conn, question["session_id"])
    _ensure_session_editable(session)
    if question["status"] != "suggested":
        raise ReviewValidationError("only suggested guiding questions can be converted")

    node_id = _create_reasoning_node(conn, question["question"], question["question"])
    if initial_note:
        _append_reasoning_note(conn, node_id, initial_note)
    review_input = create_review_session_input(conn, question["session_id"], "node", node_id, "agent_suggestion")
    topic_link = create_topic_link(conn, session["primary_topic_id"], "node", node_id)
    timestamp = now_iso()
    conn.execute(
        """
        UPDATE review_guiding_question
        SET status = 'converted',
            created_node_id = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (node_id, timestamp, question_id),
    )
    return {
        "guiding_question": dict(_get_guiding_question_row(conn, question_id)),
        "node_id": node_id,
        "review_session_input": review_input,
        "topic_link": topic_link,
    }


def create_review_session_node(
    conn: sqlite3.Connection,
    session_id: str,
    question: str,
    title: Optional[str],
) -> dict:
    session = _get_session_row(conn, session_id)
    _ensure_session_editable(session)
    node_id = _create_reasoning_node(conn, title or question, question)
    review_input = create_review_session_input(conn, session_id, "node", node_id, "user")
    topic_link = create_topic_link(conn, session["primary_topic_id"], "node", node_id)
    return {
        "node_id": node_id,
        "review_session_input": review_input,
        "topic_link": topic_link,
    }


def _get_guiding_question_row(conn: sqlite3.Connection, question_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM review_guiding_question WHERE id = ?", (question_id,)).fetchone()
    if row is None:
        raise ReviewGuidingQuestionNotFoundError("Guiding Question not found")
    return row


def _create_reasoning_node(conn: sqlite3.Connection, title: str, content: str) -> str:
    timestamp = now_iso()
    node_id = _new_id()
    message_id = _new_id()
    interpretation_id = _new_id()
    entities_json, keywords_json = extract_interpretation(content)
    conn.execute(
        """
        INSERT INTO node (id, node_type, title, lifecycle_status, created_at, updated_at, archived_at)
        VALUES (?, 'reasoning', ?, 'open', ?, ?, NULL)
        """,
        (node_id, title[:80], timestamp, timestamp),
    )
    conn.execute(
        """
        INSERT INTO node_message (id, node_id, role, content, message_type, created_at)
        VALUES (?, ?, 'user', ?, 'reasoning', ?)
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
    return node_id


def _append_reasoning_note(conn: sqlite3.Connection, node_id: str, content: str) -> None:
    conn.execute(
        """
        INSERT INTO node_message (id, node_id, role, content, message_type, created_at)
        VALUES (?, ?, 'user', ?, 'reply', ?)
        """,
        (_new_id(), node_id, content, now_iso()),
    )
