# DragonMind v0.1.1 Knowledge Ingestion Spec

Status: Design Draft

Base version: `v0.1-mvp`

Base tag: `v0.1-mvp`

Base tag commit: `8c77284`

Current main at design time: `112e55c`

Date: 2026-06-29

---

## 1. v0.1.1 Goal

v0.1.1 adds the smallest useful Knowledge Ingestion loop on top of the sealed v0.1 MVP.

The goal is not to build RAG, long-term memory, semantic search, or automatic reasoning over documents.

The goal is:

1. The user can paste or upload reference material.
2. DragonMind stores the material as a `knowledge_source`.
3. DragonMind splits the material into `knowledge_chunk` records.
4. The user can view and keyword-search material from Node Detail.
5. The user can attach a specific `knowledge_chunk` as Evidence to a Node or Relation.
6. Evidence can support, contradict, or neutrally record facts for an existing Node or Relation.

v0.1.1 must preserve the v0.1 graph-first model:

- Node remains the stable cognitive object shell.
- Relation remains the graph connection layer.
- Evidence remains the explicit cited material attached to a Node or Relation.
- Knowledge is background material until the user promotes a chunk into Evidence.

---

## 2. Knowledge vs Evidence Boundary

### Knowledge

Knowledge is background source material.

Examples:

- A pasted article.
- A meeting note pasted from another tool.
- A PDF or text document uploaded locally.
- A copied transcript.
- A research note.

Knowledge is not automatically treated as a fact about any Node.

Knowledge can be searched and inspected. It does not directly affect Node state, Relation state, Task state, or Discovery Feed unless the user explicitly attaches a chunk as Evidence.

### Evidence

Evidence is cited material attached to a specific target:

- `target_type = node`
- `target_type = relation`

Evidence is the point where background Knowledge becomes relevant to DragonMind's graph.

Evidence must carry a stance:

- `supports`
- `contradicts`
- `neutral`

### Boundary Rule

A `knowledge_chunk` is only background material.

A `knowledge_chunk` becomes operationally relevant when the user creates an `evidence` record from it.

The system must not automatically convert chunks into Evidence.

---

## 3. Database Design

v0.1.1 should add two new tables and one backward-compatible nullable column to `evidence`.

Suggested migration order:

- `007_create_knowledge_source.sql`
- `008_create_knowledge_chunk.sql`
- `009_add_evidence_knowledge_chunk_id.sql`

### 3.1 `knowledge_source`

Purpose:

Stores source-level metadata for pasted or uploaded material.

Fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | TEXT PRIMARY KEY | yes | UUID |
| `source_type` | TEXT | yes | `paste`, `file` |
| `title` | TEXT | yes | User-provided or derived from filename / first line |
| `original_filename` | TEXT | no | Only for uploaded files |
| `mime_type` | TEXT | no | For uploaded files |
| `storage_path` | TEXT | yes | Local path to source directory containing `extracted.txt` and optional original file |
| `content_sha256` | TEXT | yes | Hash of normalized extracted text |
| `created_at` | TEXT | yes | ISO-8601 |
| `updated_at` | TEXT | yes | ISO-8601 |

Constraints:

- `source_type IN ('paste', 'file')`
- `title` must be non-empty.
- `content_sha256` must be non-empty.

Indexes:

- `idx_knowledge_source_source_type`
- `idx_knowledge_source_created_at`
- `idx_knowledge_source_content_sha256`

Notes:

- `knowledge_source` stores metadata only.
- v0.1.1 does not store full `text_content` in the `knowledge_source` table.
- `knowledge_chunk.content` is the primary text source for search, UI display, and Evidence creation.
- Local `extracted.txt` is rebuild/debug material, not the UI query source of truth.
- Paste and file imports both write normalized extracted text to local `extracted.txt`.
- SQLite stores source metadata plus chunks. Do not introduce a separate full-body text copy in SQLite.
- `content_sha256` is always computed from normalized extracted text.
- Paste and file imports use the same normalized extracted text hash semantics.
- v0.1.1 does not add `file_sha256`.
- Duplicate detection is based on `content_sha256`.
- Duplicate import strategy is warn only. Do not block import.
- API responses may return `is_duplicate: true` and `duplicate_of_source_id`.

### 3.2 `knowledge_chunk`

Purpose:

Stores searchable text chunks derived from a `knowledge_source`.

Fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | TEXT PRIMARY KEY | yes | UUID |
| `source_id` | TEXT | yes | References `knowledge_source(id)` |
| `chunk_index` | INTEGER | yes | Zero-based order in source |
| `content` | TEXT | yes | Chunk text |
| `char_start` | INTEGER | no | Start offset in normalized text |
| `char_end` | INTEGER | no | End offset in normalized text |
| `token_estimate` | INTEGER | no | Simple approximate token count |
| `created_at` | TEXT | yes | ISO-8601 |

Constraints:

- `source_id REFERENCES knowledge_source(id)`
- `chunk_index >= 0`
- `(source_id, chunk_index)` should be unique.
- `content` must be non-empty.

Indexes:

- `idx_knowledge_chunk_source_id`
- `idx_knowledge_chunk_source_order` on `(source_id, chunk_index)`
- `idx_knowledge_chunk_created_at`

SQLite search:

- FTS5 is deferred.
- v0.1.1 does not require or create an FTS table.
- Acceptance only requires SQLite `LIKE` search against `knowledge_chunk.content`.
- Later versions may introduce FTS5 or semantic search under a separate spec.

### 3.3 Evidence Table Change

v0.1.1 should add one nullable column to the existing `evidence` table:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `knowledge_chunk_id` | TEXT | no | References `knowledge_chunk(id)` when Evidence is created from Knowledge |

Migration:

```sql
ALTER TABLE evidence ADD COLUMN knowledge_chunk_id TEXT;
CREATE INDEX IF NOT EXISTS idx_evidence_knowledge_chunk_id ON evidence (knowledge_chunk_id);
```

SQLite note:

- SQLite cannot easily add a foreign key constraint with `ALTER TABLE`.
- Application-level validation must ensure `knowledge_chunk_id` exists when provided.

Why this column is needed:

- Existing `evidence.source` and `source_url` can store human-readable attribution, but they are not enough for stable local navigation back to the original chunk.
- A nullable `knowledge_chunk_id` preserves v0.1 evidence behavior while enabling exact source traceability.
- Existing Evidence records remain valid with `knowledge_chunk_id = NULL`.

What should not change:

- Do not change `target_type`.
- Do not change `target_id`.
- Do not add Evidence as a Node.
- Do not add Evidence to the Relation graph.
- Do not add new Evidence stance values.

---

## 4. API Design

All APIs are local-first and synchronous for v0.1.1.

### 4.1 Create Knowledge Source From Pasted Text

`POST /knowledge-sources/text`

Request:

```json
{
  "title": "渠道转化会议纪要",
  "content": "..."
}
```

Behavior:

1. Validate non-empty content.
2. Normalize text.
3. Compute `content_sha256`.
4. Create `knowledge_source` with `source_type = paste`.
5. Write normalized extracted text to local `extracted.txt`.
6. Create `knowledge_chunk` records.
7. Return source with chunk summary and duplicate warning metadata when applicable.

Response:

```json
{
  "source": {
    "id": "uuid",
    "source_type": "paste",
    "title": "渠道转化会议纪要",
    "content_sha256": "...",
    "is_duplicate": false,
    "duplicate_of_source_id": null
  },
  "chunks": [
    {
      "id": "uuid",
      "source_id": "uuid",
      "chunk_index": 0,
      "content": "..."
    }
  ]
}
```

### 4.2 Upload Knowledge File

`POST /knowledge-sources/file`

Request:

- `multipart/form-data`
- fields:
  - `file`
  - optional `title`

Supported v0.1.1 formats:

- `.txt`
- `.md`
- `.csv`
- `.json`

PDF, DOCX, web pages, images, OCR, and binary parsing are out of scope for v0.1.1 unless a future patch explicitly adds them.

Implementation dependency:

- FastAPI file upload requires `python-multipart`.
- If `POST /knowledge-sources/file` is implemented, `apps/api/requirements.txt` and README local setup instructions must be updated.
- v0.1.1 still supports both paste and file ingestion, but implementation may complete paste ingestion first.
- File upload must not block paste ingestion implementation or paste ingestion acceptance.

Behavior:

1. Store the uploaded file locally.
2. Extract normalized text for supported formats.
3. Compute `content_sha256` from normalized extracted text, not file bytes.
4. Write normalized extracted text to local `extracted.txt`.
5. Create `knowledge_source` with `source_type = file`.
6. Create chunks.
7. Return source and chunk summary, including duplicate warning metadata when applicable.

### 4.3 List Knowledge Sources

`GET /knowledge-sources`

Optional query params:

- `q`
- `source_type`
- `limit`
- `offset`

Returns:

- source metadata
- chunk count
- created time

### 4.4 Get Knowledge Source Detail

`GET /knowledge-sources/{source_id}`

Returns:

- source metadata
- chunks ordered by `chunk_index`

### 4.5 Search Knowledge Chunks

`GET /knowledge-chunks/search?q=&source_id=&limit=&offset=`

Search strategy:

- Use SQLite `LIKE` against `knowledge_chunk.content`.
- v0.1.1 does not create or require FTS5 tables.

Response item:

```json
{
  "id": "chunk-id",
  "source_id": "source-id",
  "source_title": "渠道转化会议纪要",
  "chunk_index": 3,
  "content": "...",
  "snippet": "..."
}
```

### 4.6 Create Evidence From Knowledge Chunk

`POST /knowledge-chunks/{chunk_id}/evidence`

Request:

```json
{
  "target_type": "node",
  "target_id": "node-id",
  "evidence_type": "document",
  "stance": "supports",
  "content_override": "optional shorter excerpt"
}
```

Behavior:

1. Validate `knowledge_chunk` exists.
2. Validate target exists using the same application-layer validation as existing Evidence.
3. Create `evidence`.
4. Set `knowledge_chunk_id = chunk_id`.
5. Set `content` to `content_override` if provided, otherwise the chunk content.
6. Set `source` to the knowledge source title plus chunk index.
7. Preserve existing Task Revival behavior for Evidence creation.

Notes:

- This API should reuse existing Evidence service behavior where possible.
- It should not create a Relation.
- It should not create a Node.
- It should not infer stance automatically.

### 4.7 Evidence Query Compatibility

Existing endpoint:

`GET /evidence?target_type=&target_id=`

v0.1.1 must remain backward compatible.

Evidence response should add a nullable `knowledge_chunk_id` field:

```json
{
  "id": "evidence-id",
  "target_type": "node",
  "target_id": "node-id",
  "evidence_type": "document",
  "stance": "supports",
  "content": "...",
  "knowledge_chunk_id": "chunk-id"
}
```

Rules:

- Do not default to nested `knowledge_source` metadata in `GET /evidence`.
- Frontend should query chunk/source detail APIs when it needs source details.
- `GET /knowledge-chunks/search` may return `source_title` as query response display metadata.
- `source_title` is not stored on `knowledge_chunk`; it is joined or assembled at query time.

---

## 5. Frontend Page / Component Design

v0.1.1 should keep the Single Focus mobile UI intact.

Knowledge Ingestion is a supporting capability, not a new top-level product mindset.

### 5.1 Node Detail Additions

Node Detail should add a secondary Knowledge area:

- Search input: `搜索资料`
- Result list of matching `knowledge_chunk`
- Each result shows:
  - source title
  - chunk snippet
  - chunk index or position
  - action: `挂为证据`

The action opens an attach modal:

- target type: current Node by default
- stance:
  - supports
  - contradicts
  - neutral
- evidence type:
  - document by default
  - user may select fact/data/experience if appropriate
- excerpt preview
- confirm button

### 5.2 Knowledge Source Import UI

Minimal entry points:

1. Node Detail secondary action: `添加资料`
2. Optional route: `/knowledge`

For v0.1.1, `/knowledge` may be a simple local library page:

- Paste text tab
- Upload file tab
- Source list
- Source detail with chunks

Do not make `/knowledge` the primary product homepage.

### 5.3 Evidence Panel Update

Evidence panel should show whether an Evidence item came from a knowledge chunk.

Suggested display:

- stance label
- evidence type
- excerpt
- source title
- action: open source chunk modal

Do not expose raw `knowledge_chunk_id` in the UI.

---

## 6. File Storage Strategy

v0.1.1 remains local-first.

Suggested local storage path:

```text
apps/api/storage/knowledge/
```

Storage layout:

```text
apps/api/storage/knowledge/
  <knowledge_source_id>/
    original.<ext>
    extracted.txt
```

Rules:

- Uploaded file bytes are stored locally.
- Paste imports also write normalized extracted text to `extracted.txt`.
- Extracted normalized text is stored locally as `extracted.txt` for rebuild/debug.
- Extracted normalized text is not stored as a full-body copy in `knowledge_source`.
- SQLite stores source metadata and chunk content only.
- `knowledge_chunk.content` is the primary fact source for search, UI display, and Evidence creation.
- `extracted.txt` is not the UI query source of truth.
- No cloud sync.
- No external object storage.
- No remote parsing service.

Security notes:

- Treat uploaded files as untrusted input.
- Do not execute uploaded files.
- Enforce file size limits.
- Store files under controlled local storage path only.

Suggested v0.1.1 limits:

- Max pasted text size: 200 KB.
- Max uploaded file size: 5 MB.
- Max chunk count per source: 500.

---

## 7. Pasted Text Handling

Pasted text flow:

1. User submits title and content.
2. Backend normalizes line endings to `\n`.
3. Backend trims leading/trailing whitespace.
4. Backend collapses excessive blank lines if needed.
5. Backend computes SHA-256 over normalized content.
6. Backend writes normalized content to local `extracted.txt`.
7. Backend stores source metadata and chunks.

Hash rule:

- `content_sha256` is computed from normalized extracted text.
- Paste and file imports use the same hash semantics.
- Duplicate detection is warn only and does not block import.

Title derivation:

- Use user-provided title if present.
- Otherwise use first non-empty line.
- If first line is too long, truncate for display only.

No summarization is required.

No automatic interpretation is required.

No automatic Evidence is created.

---

## 8. Uploaded File Handling

Supported minimum formats:

- `.txt`: read as UTF-8 text.
- `.md`: read as UTF-8 text.
- `.csv`: read as UTF-8 text; no table intelligence required.
- `.json`: pretty-print or store raw text; no schema inference required.

Out of scope:

- PDF parsing.
- DOCX parsing.
- HTML extraction.
- Web clipping.
- Image OCR.
- Audio/video transcription.

Upload flow:

1. Validate file extension and size.
2. Store original file locally.
3. Extract text.
4. Normalize extracted text with the same rules used for pasted text.
5. Compute `content_sha256` from normalized extracted text.
6. Store normalized extracted text locally as `extracted.txt`.
7. Store `knowledge_source` metadata.
8. Store `knowledge_chunk`.
9. Return source and chunk summary, including duplicate warning metadata when applicable.

Implementation dependency:

- FastAPI file upload requires `python-multipart`.
- If file upload is implemented, update backend dependency list and README setup instructions.
- Paste ingestion should be implemented and accepted first.
- File upload must not block paste ingestion implementation or acceptance.

If extraction fails:

- Do not create partial chunks.
- Return a clear validation error.

---

## 9. Chunking Strategy

v0.1.1 should use deterministic chunking.

Recommended defaults:

- Target chunk size: 1,000 characters.
- Soft minimum chunk size: 300 characters.
- Default overlap: 0 characters.
- Preserve paragraph boundaries when possible.
- Fall back to character boundaries for long paragraphs.

Chunking rules:

1. Split normalized text by blank lines into paragraphs.
2. Accumulate paragraphs until target size is reached.
3. If a paragraph exceeds target size, split by sentence punctuation if possible.
4. If still too large, split by character count.
5. Normal paragraph-accumulated chunks have no overlap.
6. Only long paragraphs that must be hard-split by character count use overlap.
7. Hard-split long paragraph chunks use a fixed 100-character overlap.
8. The 100-character overlap comes from the end of the previous hard-split chunk.
9. The overlap rule must be deterministic, testable, and reproducible from the same normalized text.

Metadata:

- Store `chunk_index`.
- Store `char_start` and `char_end` when easy to compute.
- Store `token_estimate` as `ceil(char_count / 4)` or similar heuristic.

No embedding is created.

No semantic ranking is required.

---

## 10. Relationship To Existing Objects

### Node

Knowledge is not a Node.

Knowledge can be cited as Evidence for a Node.

Node Detail may provide search and attach UI.

### Relation

Knowledge is not part of the Relation graph.

Knowledge can be cited as Evidence for a Relation.

### Evidence

Evidence remains the bridge between background Knowledge and cognitive graph targets.

When created from a chunk:

- `evidence.target_type` remains `node` or `relation`.
- `evidence.target_id` remains the target ID.
- `evidence.knowledge_chunk_id` points back to the source chunk.
- `evidence.stance` is chosen by the user.

### Task

Knowledge import should not automatically create Tasks.

Evidence creation from Knowledge should keep existing Evidence behavior:

- If Evidence creation currently revives sleeping related tasks, preserve that behavior.

Optional but not required:

- A failed import may show a frontend error.
- No background ingestion task table is needed for v0.1.1.

### Discovery Feed

Knowledge import should not automatically create Discovery Feed items.

Evidence created from Knowledge may appear as an Evidence-related item if existing Discovery Feed logic already surfaces Evidence.

---

## 11. Explicit Non-Goals

v0.1.1 must not include:

- Vector DB.
- RAG.
- Embeddings.
- Semantic search.
- Automatic long-term memory.
- Automatic Concept creation.
- Automatic Insight creation.
- Automatic Attention Pattern creation.
- Automatic Outcome / Review.
- Radius1.
- Historical counterexample discovery.
- Cloud sync.
- Multi-user.
- Conversation management.
- Project management.
- Automatic fact judgment.
- Automatic Evidence creation from every chunk.
- Web crawler.
- Browser extension.
- PDF/DOCX/OCR unless separately scoped.

---

## 12. v0.1.1 Acceptance Criteria

### Data

- `knowledge_source` table exists.
- `knowledge_chunk` table exists.
- Existing v0.1 tables continue to work.
- Existing Evidence records without `knowledge_chunk_id` remain valid.
- Evidence created from a chunk stores `knowledge_chunk_id`.
- `knowledge_source` stores metadata only and does not store full `text_content`.
- `knowledge_chunk.content` is the primary text source for search, UI display, and Evidence creation.
- No FTS table is required for v0.1.1.

### Pasted Text

- User can paste text and title.
- System creates one `knowledge_source`.
- System creates one or more ordered `knowledge_chunk` records.
- System writes normalized extracted text to local `extracted.txt`.
- Chunks are retrievable from source detail.

### Uploaded File

- User can upload a supported local text-based file.
- System stores the original file locally.
- System extracts text.
- System writes normalized extracted text to local `extracted.txt`.
- System creates source and chunks.
- Unsupported file types fail with a clear error.
- File upload depends on `python-multipart`, but file upload does not block paste ingestion acceptance.

### Search / View

- User can search chunks by keyword.
- Search works without Vector DB.
- Search works through SQLite `LIKE` without FTS5.
- Node Detail can show matching chunks.
- User can open a chunk/source preview.

### Evidence

- User can attach a chunk as Evidence to a Node.
- User can attach a chunk as Evidence to a Relation.
- User must choose stance: supports / contradicts / neutral.
- Created Evidence appears in the existing Evidence panel.
- Evidence source can navigate back to the chunk/source.

### Regression

- v0.1 Spark capture still works.
- Node Detail still works.
- Relation and stage progression still work.
- Task state machine still works.
- Archive still works.
- Single Focus home remains unchanged as the primary experience.
- No forbidden v0.1.1 non-goal table is created.

---

## 13. Implementation Risks

### Scope Creep Into RAG

Risk:

Knowledge ingestion may drift into embeddings, retrieval orchestration, or answer generation.

Mitigation:

Only support keyword search and explicit user attachment as Evidence.

### Evidence Boundary Confusion

Risk:

Users or code may treat every chunk as Evidence.

Mitigation:

Keep Knowledge passive until the user explicitly attaches a chunk to a Node or Relation.

### File Parsing Complexity

Risk:

PDF, DOCX, OCR, web extraction, and malformed encodings can consume implementation time.

Mitigation:

Limit v0.1.1 to plain text-oriented formats.

### SQLite Text Size Growth

Risk:

Large pasted sources may make the local SQLite database heavy.

Mitigation:

Set file and text size limits. Store original files and `extracted.txt` locally. Store source metadata plus chunks in SQLite, without a full-body `text_content` copy.

### Search Quality

Risk:

Simple keyword search may be less powerful than semantic search.

Mitigation:

Accept this as a v0.1.1 tradeoff. Do not introduce Vector DB, embeddings, FTS5 requirements, or semantic search.

### Backward Compatibility

Risk:

Changing Evidence response shape may break existing frontend.

Mitigation:

Add only nullable `knowledge_chunk_id` to the base Evidence response. Do not default to nested `knowledge_source` metadata.

---

## 14. Suggested Development Order

1. Add migrations:
   - `007_create_knowledge_source`
   - `008_create_knowledge_chunk`
   - `009_add_evidence_knowledge_chunk_id`
2. Add backend constants and validators for:
   - knowledge source type
   - supported upload extensions
   - file size limits
3. Implement text normalization and chunking service.
4. Implement `POST /knowledge-sources/text`.
5. Implement source detail and chunk list APIs.
6. Implement keyword search with SQLite `LIKE`.
7. Implement `POST /knowledge-chunks/{chunk_id}/evidence`.
8. Extend Evidence response with nullable `knowledge_chunk_id`.
9. Add frontend lookup to show source chunk details when needed.
10. Add Node Detail Knowledge search / attach UI.
11. Implement upload API for `.txt`, `.md`, `.csv`, `.json`; add `python-multipart` when this step begins.
12. Add minimal `/knowledge` library page only if needed.
13. Run regression:
    - v0.1 E2E smoke path
    - Knowledge import path
    - Evidence-from-chunk path

---

## 15. Architecture Decisions Adopted After Audit

These decisions are accepted for v0.1.1 implementation:

1. `knowledge_source.text_content` is not stored in SQLite for v0.1.1.
   - SQLite stores source metadata plus `knowledge_chunk.content`.
   - Local `extracted.txt` stores normalized full extracted text for rebuild/debug.
2. SQLite FTS5 is deferred.
   - v0.1.1 does not require or create FTS tables.
   - Acceptance requires SQLite `LIKE` search only.
3. Evidence API does not default to nested knowledge source metadata.
   - Evidence response adds nullable `knowledge_chunk_id`.
   - Frontend fetches chunk/source detail separately when needed.
4. File and text limits:
   - Max pasted text size: 200 KB.
   - Max uploaded file size: 5 MB.
   - Max chunk count per source: 500.
5. Duplicate `content_sha256` behavior:
   - Warn only.
   - Do not block import.
   - API may return `is_duplicate: true` and `duplicate_of_source_id`.

Implementation note:

- `content_sha256` is always computed from normalized extracted text.
- v0.1.1 does not add `file_sha256`.
- Search response may include `source_title` as query response display metadata. It is not persisted on `knowledge_chunk`.
