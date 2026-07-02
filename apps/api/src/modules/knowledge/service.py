import hashlib
import re
import sqlite3
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from src.config.settings import API_ROOT
from src.modules.evidence.service import EvidenceTargetNotFoundError, create_evidence
from src.shared.constants import (
    KNOWLEDGE_HARD_SPLIT_OVERLAP_CHARS,
    KNOWLEDGE_MAX_CHUNKS_PER_SOURCE,
    KNOWLEDGE_MAX_UPLOADED_FILE_BYTES,
    KNOWLEDGE_SOFT_MIN_CHARS,
    KNOWLEDGE_SUPPORTED_EXTENSIONS,
    KNOWLEDGE_TARGET_CHARS,
)
from src.shared.time import now_iso


KNOWLEDGE_STORAGE_DIR = API_ROOT / "storage" / "knowledge"


class KnowledgeSourceNotFoundError(Exception):
    pass


class KnowledgeChunkNotFoundError(Exception):
    pass


class KnowledgeValidationError(Exception):
    pass


@dataclass
class TextUnit:
    content: str
    char_start: int
    char_end: int
    hard_split: bool = False


@dataclass
class ChunkDraft:
    content: str
    char_start: int
    char_end: int
    token_estimate: int


def _new_id() -> str:
    return str(uuid.uuid4())


def normalize_text(content: str) -> str:
    normalized = content.replace("\r\n", "\n").replace("\r", "\n").strip()
    normalized = re.sub(r"\n[ \t]*\n(?:[ \t]*\n)+", "\n\n", normalized)
    return normalized


def content_sha256(normalized_text: str) -> str:
    return hashlib.sha256(normalized_text.encode("utf-8")).hexdigest()


def _title_from_text(normalized_text: str, title: Optional[str]) -> str:
    if title and title.strip():
        return title.strip()
    first_line = next((line.strip() for line in normalized_text.splitlines() if line.strip()), "")
    return (first_line or "Untitled knowledge source")[:80]


def _title_from_file(original_filename: str, title: Optional[str]) -> str:
    if title and title.strip():
        return title.strip()
    stem = Path(original_filename).stem.strip()
    return (stem or "Untitled knowledge source")[:80]


def _token_estimate(content: str) -> int:
    return max(1, (len(content) + 3) // 4)


def _paragraph_units(normalized_text: str) -> list[TextUnit]:
    units: list[TextUnit] = []
    for match in re.finditer(r"(?s)(?:^|\n\n)(.*?)(?=\n\n|$)", normalized_text):
        paragraph = match.group(1).strip()
        if not paragraph:
            continue
        start = normalized_text.find(paragraph, match.start())
        end = start + len(paragraph)
        units.extend(_split_paragraph(paragraph, start))
    return units


def _split_paragraph(paragraph: str, absolute_start: int) -> list[TextUnit]:
    if len(paragraph) <= KNOWLEDGE_TARGET_CHARS:
        return [TextUnit(paragraph, absolute_start, absolute_start + len(paragraph))]

    sentence_units = _split_sentences(paragraph, absolute_start)
    if sentence_units and all(len(unit.content) <= KNOWLEDGE_TARGET_CHARS for unit in sentence_units):
        return sentence_units

    units: list[TextUnit] = []
    start = 0
    while start < len(paragraph):
        end = min(start + KNOWLEDGE_TARGET_CHARS, len(paragraph))
        content = paragraph[start:end]
        units.append(TextUnit(content, absolute_start + start, absolute_start + end, hard_split=True))
        if end >= len(paragraph):
            break
        start = max(0, end - KNOWLEDGE_HARD_SPLIT_OVERLAP_CHARS)
    return units


def _split_sentences(paragraph: str, absolute_start: int) -> list[TextUnit]:
    matches = list(re.finditer(r"[^。！？!?；;]+[。！？!?；;]?", paragraph))
    if len(matches) <= 1:
        return []
    return [
        TextUnit(match.group(0).strip(), absolute_start + match.start(), absolute_start + match.end())
        for match in matches
        if match.group(0).strip()
    ]


def chunk_text(normalized_text: str) -> list[ChunkDraft]:
    units = _paragraph_units(normalized_text)
    chunks: list[ChunkDraft] = []
    current_parts: list[str] = []
    current_start: Optional[int] = None
    current_end: Optional[int] = None

    def flush_current() -> None:
        nonlocal current_parts, current_start, current_end
        if not current_parts or current_start is None or current_end is None:
            return
        content = "\n\n".join(current_parts)
        chunks.append(ChunkDraft(content, current_start, current_end, _token_estimate(content)))
        current_parts = []
        current_start = None
        current_end = None

    for unit in units:
        if unit.hard_split:
            flush_current()
            chunks.append(ChunkDraft(unit.content, unit.char_start, unit.char_end, _token_estimate(unit.content)))
            continue

        separator_size = 2 if current_parts else 0
        current_size = sum(len(part) for part in current_parts) + max(0, len(current_parts) - 1) * 2
        would_exceed_target = current_parts and current_size + separator_size + len(unit.content) > KNOWLEDGE_TARGET_CHARS
        if would_exceed_target and current_size >= KNOWLEDGE_SOFT_MIN_CHARS:
            flush_current()

        if current_start is None:
            current_start = unit.char_start
        current_end = unit.char_end
        current_parts.append(unit.content)

    flush_current()
    if not chunks:
        raise KnowledgeValidationError("knowledge content produced no chunks")
    if len(chunks) > KNOWLEDGE_MAX_CHUNKS_PER_SOURCE:
        raise KnowledgeValidationError("knowledge source exceeds max chunk count")
    return chunks


def create_text_source(conn: sqlite3.Connection, title: Optional[str], content: str) -> dict:
    normalized = normalize_text(content)
    if not normalized:
        raise KnowledgeValidationError("knowledge content is empty")

    digest = content_sha256(normalized)
    duplicate = conn.execute(
        """
        SELECT id FROM knowledge_source
        WHERE content_sha256 = ?
        ORDER BY created_at ASC
        LIMIT 1
        """,
        (digest,),
    ).fetchone()
    source_id = _new_id()
    timestamp = now_iso()
    source_title = _title_from_text(normalized, title)
    storage_dir = KNOWLEDGE_STORAGE_DIR / source_id
    _write_extracted_text(storage_dir, normalized)
    chunks = chunk_text(normalized)

    conn.execute(
        """
        INSERT INTO knowledge_source (
          id, source_type, title, original_filename, mime_type, storage_path,
          content_sha256, created_at, updated_at
        )
        VALUES (?, 'paste', ?, NULL, NULL, ?, ?, ?, ?)
        """,
        (source_id, source_title, str(storage_dir), digest, timestamp, timestamp),
    )
    _insert_chunks(conn, source_id, chunks, timestamp)
    return {
        "source": _get_source(conn, source_id),
        "chunks": list_chunks_for_source(conn, source_id),
        "is_duplicate": duplicate is not None,
        "duplicate_of_source_id": duplicate["id"] if duplicate else None,
    }


def create_file_source(
    conn: sqlite3.Connection,
    title: Optional[str],
    original_filename: str,
    mime_type: Optional[str],
    content: bytes,
) -> dict:
    safe_filename = Path(original_filename or "").name
    extension = Path(safe_filename).suffix.lower()
    if not safe_filename or extension not in KNOWLEDGE_SUPPORTED_EXTENSIONS:
        raise KnowledgeValidationError("unsupported knowledge file type")
    if len(content) > KNOWLEDGE_MAX_UPLOADED_FILE_BYTES:
        raise KnowledgeValidationError("uploaded file exceeds max size")

    try:
        extracted_text = content.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise KnowledgeValidationError("knowledge file must be UTF-8 text") from exc

    normalized = normalize_text(extracted_text)
    if not normalized:
        raise KnowledgeValidationError("knowledge content is empty")

    digest = content_sha256(normalized)
    chunks = chunk_text(normalized)
    duplicate = conn.execute(
        """
        SELECT id FROM knowledge_source
        WHERE content_sha256 = ?
        ORDER BY created_at ASC
        LIMIT 1
        """,
        (digest,),
    ).fetchone()
    source_id = _new_id()
    timestamp = now_iso()
    source_title = _title_from_file(safe_filename, title)
    storage_dir = KNOWLEDGE_STORAGE_DIR / source_id
    _write_original_file(storage_dir, extension, content)
    _write_extracted_text(storage_dir, normalized)

    conn.execute(
        """
        INSERT INTO knowledge_source (
          id, source_type, title, original_filename, mime_type, storage_path,
          content_sha256, created_at, updated_at
        )
        VALUES (?, 'file', ?, ?, ?, ?, ?, ?, ?)
        """,
        (source_id, source_title, safe_filename, mime_type, str(storage_dir), digest, timestamp, timestamp),
    )
    _insert_chunks(conn, source_id, chunks, timestamp)
    return {
        "source": _get_source(conn, source_id),
        "chunks": list_chunks_for_source(conn, source_id),
        "is_duplicate": duplicate is not None,
        "duplicate_of_source_id": duplicate["id"] if duplicate else None,
    }


def _write_extracted_text(storage_dir: Path, normalized_text: str) -> None:
    storage_dir.mkdir(parents=True, exist_ok=True)
    (storage_dir / "extracted.txt").write_text(normalized_text, encoding="utf-8")


def _write_original_file(storage_dir: Path, extension: str, content: bytes) -> None:
    storage_dir.mkdir(parents=True, exist_ok=True)
    (storage_dir / f"original{extension}").write_bytes(content)


def _insert_chunks(conn: sqlite3.Connection, source_id: str, chunks: list[ChunkDraft], timestamp: str) -> None:
    for index, chunk in enumerate(chunks):
        conn.execute(
            """
            INSERT INTO knowledge_chunk (
              id, source_id, chunk_index, content, char_start, char_end, token_estimate, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (_new_id(), source_id, index, chunk.content, chunk.char_start, chunk.char_end, chunk.token_estimate, timestamp),
        )


def _get_source(conn: sqlite3.Connection, source_id: str) -> dict:
    row = conn.execute("SELECT * FROM knowledge_source WHERE id = ?", (source_id,)).fetchone()
    if row is None:
        raise KnowledgeSourceNotFoundError("Knowledge source not found")
    return dict(row)


def list_sources(
    conn: sqlite3.Connection,
    q: Optional[str],
    source_type: Optional[str],
    limit: int,
    offset: int,
) -> list[dict]:
    clauses = []
    params: list[object] = []
    if q:
        clauses.append("ks.title LIKE ?")
        params.append(f"%{q}%")
    if source_type:
        clauses.append("ks.source_type = ?")
        params.append(source_type)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    params.extend([limit, offset])
    rows = conn.execute(
        f"""
        SELECT ks.*, COUNT(kc.id) AS chunk_count
        FROM knowledge_source ks
        LEFT JOIN knowledge_chunk kc ON kc.source_id = ks.id
        {where}
        GROUP BY ks.id
        ORDER BY ks.created_at DESC
        LIMIT ? OFFSET ?
        """,
        params,
    ).fetchall()
    return [dict(row) for row in rows]


def get_source_detail(conn: sqlite3.Connection, source_id: str) -> dict:
    return {
        "source": _get_source(conn, source_id),
        "chunks": list_chunks_for_source(conn, source_id),
    }


def list_chunks_for_source(conn: sqlite3.Connection, source_id: str) -> list[dict]:
    _get_source(conn, source_id)
    rows = conn.execute(
        """
        SELECT * FROM knowledge_chunk
        WHERE source_id = ?
        ORDER BY chunk_index ASC
        """,
        (source_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def search_chunks(
    conn: sqlite3.Connection,
    q: str,
    source_id: Optional[str],
    limit: int,
    offset: int,
) -> list[dict]:
    clauses = ["kc.content LIKE ?"]
    params: list[object] = [f"%{q}%"]
    if source_id:
        clauses.append("kc.source_id = ?")
        params.append(source_id)
    params.extend([limit, offset])
    rows = conn.execute(
        f"""
        SELECT kc.*, ks.title AS source_title
        FROM knowledge_chunk kc
        JOIN knowledge_source ks ON ks.id = kc.source_id
        WHERE {' AND '.join(clauses)}
        ORDER BY kc.created_at DESC, kc.chunk_index ASC
        LIMIT ? OFFSET ?
        """,
        params,
    ).fetchall()
    return [{**dict(row), "snippet": _snippet(row["content"], q)} for row in rows]


def _snippet(content: str, q: str) -> str:
    index = content.find(q)
    if index < 0:
        return content[:160]
    start = max(0, index - 60)
    end = min(len(content), index + len(q) + 100)
    return content[start:end]


def create_evidence_from_chunk(
    conn: sqlite3.Connection,
    chunk_id: str,
    target_type: str,
    target_id: str,
    evidence_type: str,
    stance: str,
    content_override: Optional[str],
) -> dict:
    row = conn.execute(
        """
        SELECT kc.*, ks.title AS source_title
        FROM knowledge_chunk kc
        JOIN knowledge_source ks ON ks.id = kc.source_id
        WHERE kc.id = ?
        """,
        (chunk_id,),
    ).fetchone()
    if row is None:
        raise KnowledgeChunkNotFoundError("Knowledge chunk not found")
    content = content_override or row["content"]
    source = f"{row['source_title']} #chunk {row['chunk_index']}"
    try:
        return create_evidence(
            conn,
            target_type,
            target_id,
            evidence_type,
            stance,
            content,
            source,
            None,
            knowledge_chunk_id=chunk_id,
        )
    except EvidenceTargetNotFoundError:
        raise
