# DragonMind v0.1.2 Recurring Review Context Spec

Status: Design Draft

Base version: `v0.1.1`

Base tag: `v0.1.1`

Base tag commit: `cbe1747eeb7f9babb07600e656945db0c6b66c20`

Previous sealed MVP tag: `v0.1-mvp`

Previous sealed MVP commit: `8c772849bbd6f70e6809121d17bf729f87a17fc2`

Date: 2026-07-07

---

## 1. v0.1.2 Goal

v0.1.2 introduces the smallest useful foundation for recurring review work.

The anchor use case is monthly review:

- Review current month business performance.
- Formulate next month planning questions.

This is not Topic classification.

This is not project management.

This is not Knowledge library organization.

The product object is Recurring Review Context: a structured context where DragonMind acts as a review advisor by helping the user gather confirmed inputs, identify questions worth analyzing, and turn those questions into Nodes.

v0.1.2 should establish:

1. Long-lived Topics for recurring domains.
2. Review Sessions for specific business periods.
3. Review Sections for stable review structure.
4. Agent-suggested Guiding Questions with rationale.
5. Explicit links between Review Sessions, Nodes, and Knowledge Sources.
6. Optional cadence reminders that surface in Agent观察日报 / Discovery Feed only after user confirmation.

v0.1.2 should not generate reports, conclusions, monthly plans, or automatic classifications.

---

## 2. Product Positioning

DragonMind's role in v0.1.2 is:

复盘参谋

DragonMind can:

- Aggregate materials explicitly confirmed by the user for a Review Session.
- Propose review questions worth analyzing.
- Explain why each question is worth asking.
- Help the user turn questions into Nodes.
- Help the user notice when a judgment lacks Evidence.
- In later versions, draft a report from multiple user-reviewed Nodes.

DragonMind cannot:

- Automatically generate conclusions.
- Automatically formulate next month plans.
- Automatically generate monthly reports.
- Automatically classify all materials.
- Automatically create Evidence.
- Automatically create Review Sessions, Nodes, or Tasks.

---

## 3. Core Concepts

### 3.1 Topic

Topic is a long-lived recurring issue or domain.

Examples:

- 月度经营复盘
- 渠道质量观察
- AI Agent 设计研究

Topic is not a conclusion.

Topic is not a folder.

Topic is not a project.

Topic provides continuity across recurring Review Sessions, Nodes, and Knowledge Sources.

Lifecycle:

- `active`
- `paused`
- `archived`

Rules:

- A Topic can have many Review Sessions.
- A Topic can link to many Nodes.
- A Topic can link to many Knowledge Sources.
- A Topic should not directly own Evidence.
- A Topic should not directly form a conclusion.
- A Topic may optionally have review cadence metadata.

### 3.2 Review Session

Review Session is one concrete recurring review instance.

Example:

- 2026 年 7 月经营复盘

Review Session is an independent object.

Review Session is not a Node.

Review Session belongs to exactly one primary Topic.

Review Session has a business period:

- `period_start`
- `period_end`

Important:

`period_start` and `period_end` describe the business period being reviewed. They are not the creation time.

Status:

- `draft`
- `active`
- `completed`

There should not be both `completed` and `archived` terminal states in v0.1.2. Keep one terminal state: `completed`.

Rules:

- A Review Session can contain many Review Sections.
- A Review Session can contain many Guiding Questions.
- A Review Session can include user-confirmed Nodes.
- A Review Session can include user-confirmed Knowledge Sources.
- A Review Session does not directly store conclusions.
- A Review Session does not automatically generate Nodes.
- A Review Session does not automatically create Tasks.

### 3.3 Review Section

Review Section is a structured block under a Review Session.

Default sections can include:

- 本期目标
- 实际结果
- 关键偏差
- 异常信号
- 核心问题
- 下期计划
- 遗留问题

Review Section must be modeled as records, not only hardcoded UI labels.

Reason:

- Users may need the same default structure across sessions.
- The order and plain-text content need to be persisted.
- Later versions may add section-level summary or report drafting without changing the object boundary.

Rules:

- Section is review structure, not conclusion.
- Section content is plain text only in v0.1.2.
- v0.1.2 does not include a section completion marker.
- Section content should be user-entered or explicitly approved by the user.
- Section should not automatically generate conclusions.
- Section should not automatically become Evidence.
- Section should not automatically create Nodes.

### 3.4 Review Guiding Question

Guiding Question is not a static template question.

It is a question proposed by DragonMind after considering the current Review Session context:

- User-confirmed Nodes in `review_session_input`.
- User-confirmed Knowledge Sources in `review_session_input`.
- Review Section plain-text content in the current Review Session.

Every Guiding Question must include a rationale explaining why DragonMind is raising it.

The rationale must cite traceable input sources, such as:

- Included Node title.
- Review Section title / text.
- Knowledge Source title.

DragonMind can ask a question, but cannot automatically answer it.

The user must explicitly convert a Guiding Question before a Node is created.

Generation boundary:

- v0.1.2 guiding question generation must be deterministic / rule-based / heuristic first.
- Inputs are strictly limited to user-confirmed `review_session_input` records and current Review Section text.
- Topic-linked historical Nodes can participate only after the user explicitly adds them to `review_session_input`.
- Do not scan the entire Node store.
- Do not scan the entire Knowledge library.
- Do not use RAG.
- Do not use embeddings.
- Do not use semantic search.
- Do not perform automatic fact judgment.
- Do not generate automatic conclusions.

Suggested fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | TEXT PRIMARY KEY | yes | UUID |
| `session_id` | TEXT | yes | References `review_session(id)` |
| `question` | TEXT | yes | Human-readable question |
| `rationale` | TEXT | yes | Why this question is worth asking |
| `status` | TEXT | yes | `suggested`, `dismissed`, `converted` |
| `created_node_id` | TEXT | no | References `node(id)` after conversion |
| `created_at` | TEXT | yes | ISO-8601 |
| `updated_at` | TEXT | yes | ISO-8601 |

Status semantics:

- `suggested`: Agent proposed the question.
- `dismissed`: User explicitly dismissed the question.
- `converted`: User converted the question into a Node.

Allowed status transitions:

- `suggested -> dismissed`
- `suggested -> converted`
- `dismissed` cannot be converted.
- `converted` cannot be reverted.
- `converted` requires `created_node_id`.

Rules:

- A Guiding Question is not a Node.
- A Guiding Question is not Evidence.
- A Guiding Question does not change Review Session conclusions.
- `created_node_id` is only set after explicit user conversion.
- Conversion must append normal Node creation artifacts according to existing Node rules.

### 3.5 Node

Node remains the object that carries concrete judgment work.

Examples:

- 7 月业绩下滑的主因是什么？
- 拓科渠道转化率下降是否已经成为趋势？
- 8 月是否应该调整渠道预算？

Review Session can contain multiple Nodes.

The current month review and next month planning should be represented as different Nodes or different questions. They should not be collapsed into one long conclusion text.

Rules:

- Node remains responsible for concrete judgment questions.
- Node can be linked to one or more Topics.
- Node can be linked to one or more Review Sessions if explicitly included.
- Node is still where Evidence accumulates.
- Existing Node lifecycle, message timeline, relation, and evidence rules remain unchanged.

### 3.6 Knowledge

Knowledge Source can be included in a Review Session.

Knowledge Source can also be linked to one or more Topics.

Review Session itself still belongs to one primary Topic.

Rules:

- Knowledge is background material.
- Knowledge is not Node.
- Knowledge does not enter Relation graph.
- Knowledge import does not create Task.
- Knowledge chunk does not automatically become Evidence.
- A Knowledge chunk becomes Evidence only when the user explicitly cites it to a Node or Relation.

Input aggregation rule:

v0.1.2 only aggregates content the user has confirmed for the Review Session.

Do not scan the entire Knowledge library automatically.

### 3.7 Evidence

Evidence remains attached only to:

- Node
- Relation

Evidence must not attach directly to:

- Topic
- Review Session
- Review Section
- Guiding Question

Rules:

- Evidence does not make Topic or Review Session form conclusions.
- Evidence stance remains `supports`, `contradicts`, or `neutral`.
- Knowledge chunk still must be explicitly cited by the user before it becomes Evidence.
- Review Session may show Evidence indirectly through linked Nodes, but it should not own Evidence directly.

### 3.8 Reminder / Discovery Feed

Topic may have optional review cadence.

When a cadence is due, DragonMind may surface a Discovery Feed / Agent观察日报 item:

> 该看这个议题了。

Rules:

- Do not automatically create a Task.
- Do not automatically create a Node.
- Do not automatically create a Review Session.
- Do not automatically attach Knowledge.
- User confirmation is required before entering any session creation or review flow.

---

## 4. Recommended Data Model

v0.1.2 Foundation should add the smallest set of tables needed to represent recurring review context without changing the v0.1 graph-first model.

### 4.1 `topic`

Purpose:

Stores long-lived recurring issues.

Fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | TEXT PRIMARY KEY | yes | UUID |
| `title` | TEXT | yes | Human-readable topic name |
| `description` | TEXT | no | Optional user-facing context |
| `status` | TEXT | yes | `active`, `paused`, `archived` |
| `review_cadence` | TEXT | no | Optional: `monthly`, `quarterly`, etc. |
| `next_review_at` | TEXT | no | Optional due time for feed hint |
| `created_at` | TEXT | yes | ISO-8601 |
| `updated_at` | TEXT | yes | ISO-8601 |

Constraints:

- `title` must be non-empty.
- `status IN ('active', 'paused', 'archived')`.
- `review_cadence` is optional. v0.1.2 can support `monthly` first if implemented.

### 4.2 `review_session`

Purpose:

Stores one concrete review instance for a primary Topic.

Fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | TEXT PRIMARY KEY | yes | UUID |
| `primary_topic_id` | TEXT | yes | References `topic(id)` |
| `title` | TEXT | yes | Example: `2026 年 7 月经营复盘` |
| `period_start` | TEXT | yes | Business period start date |
| `period_end` | TEXT | yes | Business period end date |
| `status` | TEXT | yes | `draft`, `active`, `completed` |
| `created_at` | TEXT | yes | ISO-8601 |
| `updated_at` | TEXT | yes | ISO-8601 |
| `completed_at` | TEXT | no | Set when status becomes `completed` |

Constraints:

- `status IN ('draft', 'active', 'completed')`.
- `period_start <= period_end`.
- `primary_topic_id` must exist.

### 4.3 `review_section`

Purpose:

Stores the structured sections under a Review Session.

Fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | TEXT PRIMARY KEY | yes | UUID |
| `session_id` | TEXT | yes | References `review_session(id)` |
| `section_type` | TEXT | yes | Stable section key |
| `title` | TEXT | yes | User-facing section title |
| `content` | TEXT | no | Plain text only in v0.1.2 |
| `sort_order` | INTEGER | yes | Display order |
| `created_at` | TEXT | yes | ISO-8601 |
| `updated_at` | TEXT | yes | ISO-8601 |

Default `section_type` values:

- `current_goal`
- `actual_result`
- `key_deviation`
- `anomaly_signal`
- `core_question`
- `next_plan`
- `open_issue`

Rules:

- Sections should be created when a Review Session is created.
- Sections are editable structure.
- Sections store plain-text content only in v0.1.2.
- v0.1.2 does not include a section completion marker.
- Sections do not automatically generate conclusions.
- Sections are not Nodes.
- Sections are not Evidence.

### 4.4 `review_guiding_question`

Purpose:

Stores Agent-suggested review questions for a specific Review Session.

Fields are defined in section 3.4.

Additional constraints:

- `question` must be non-empty.
- `rationale` must be non-empty.
- `status IN ('suggested', 'dismissed', 'converted')`.
- `created_node_id` can only be set when status is `converted`.
- `converted` records must have `created_node_id`.
- `dismissed` records cannot later be converted in v0.1.2.

### 4.5 `topic_link`

Purpose:

Links long-lived Topics to existing objects.

This is needed because Node and Knowledge Source can belong to multiple Topics.

Fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | TEXT PRIMARY KEY | yes | UUID |
| `topic_id` | TEXT | yes | References `topic(id)` |
| `target_type` | TEXT | yes | `node`, `knowledge_source` |
| `target_id` | TEXT | yes | Existing target ID |
| `created_at` | TEXT | yes | ISO-8601 |

Constraints:

- `target_type IN ('node', 'knowledge_source')`.
- Unique constraint on `(topic_id, target_type, target_id)`.
- Target existence should be validated at the application layer.

Rules:

- Topic link does not imply Evidence.
- Topic link does not imply Relation.
- Topic link does not imply Review Session inclusion.
- v0.1.2 does not support inactive topic links.
- v0.1.2 does not add `removed_at` or link `status`.
- If future versions need to remove or pause Topic ownership, add `removed_at` or `status` in a separate migration.

### 4.6 `review_session_input`

Purpose:

Stores user-confirmed inputs included in a Review Session.

This is separate from `topic_link` because a Topic link means long-term relevance, while Review Session input means "use this in this specific review."

Fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `id` | TEXT PRIMARY KEY | yes | UUID |
| `session_id` | TEXT | yes | References `review_session(id)` |
| `target_type` | TEXT | yes | `node`, `knowledge_source` |
| `target_id` | TEXT | yes | Existing target ID |
| `source` | TEXT | yes | `user`, `agent_suggestion` |
| `confirmed_at` | TEXT | yes | ISO-8601 |
| `created_at` | TEXT | yes | ISO-8601 |

Constraints:

- `target_type IN ('node', 'knowledge_source')`.
- `source IN ('user', 'agent_suggestion')`.
- Unique link on `(session_id, target_type, target_id)`.
- Target existence should be validated at the application layer.

Rules:

- `review_session_input` stores only inputs the user has confirmed into the Session.
- Only records in `review_session_input` are aggregated for v0.1.2 review context.
- Agent suggestions must not directly enter `review_session_input`.
- If `source = agent_suggestion`, the record still means the user confirmed an Agent-suggested input.
- This table does not create Evidence.
- This table does not create Relation.

---

## 5. Workflow Semantics

### 5.1 Create Topic

User creates a long-lived Topic such as `月度经营复盘`.

DragonMind stores the Topic with `status = active`.

No Review Session, Node, Task, Evidence, or Relation is automatically created.

### 5.2 Create Review Session

User creates or confirms creation of a Review Session under one primary Topic.

The user specifies:

- Title.
- Business period start.
- Business period end.

DragonMind creates default Review Sections.

No conclusion is generated.

### 5.3 Confirm Inputs

User explicitly selects Nodes and Knowledge Sources to include in the Review Session.

DragonMind stores them in `review_session_input`.

Only confirmed inputs are eligible for v0.1.2 guiding question generation.

Agent-suggested inputs are not stored in `review_session_input` until the user confirms them.

If an input originated from an Agent suggestion, store `source = agent_suggestion` only after confirmation.

### 5.4 Generate Guiding Questions

DragonMind may inspect confirmed Review Session inputs and propose Guiding Questions.

Each question must include:

- The question.
- A rationale.

The rationale must cite traceable sources from the confirmed inputs or section text, such as:

- Included Node title.
- Review Section title / text.
- Knowledge Source title.

Generation must be deterministic / rule-based / heuristic first in v0.1.2.

Allowed generation inputs:

- `review_session_input` records confirmed by the user.
- Current Review Section plain-text content.

Disallowed generation inputs:

- Full Node store scanning.
- Full Knowledge library scanning.
- Topic-linked historical Nodes not explicitly added to `review_session_input`.
- RAG.
- Embeddings.
- Semantic search.
- Automatic fact judgment.
- Automatic conclusions.

DragonMind must not answer the question.

DragonMind must not automatically create a Node.

### 5.5 Convert Guiding Question to Node

When the user clicks a Guiding Question:

1. Create a Node for the question.
2. Link the Node to the Review Session through `review_session_input`.
3. Link the Node to the primary Topic through `topic_link`.
4. Set the Guiding Question status to `converted`.
5. Set `created_node_id`.

The created Node should follow existing Node creation rules:

- Append-only messages.
- No independent decision table.
- Evidence remains explicit.

Status rules:

- Only `suggested` Guiding Questions can be converted.
- `dismissed` Guiding Questions cannot be converted.
- `converted` Guiding Questions cannot be reverted.
- `converted` must have `created_node_id`.

### 5.6 User-Created Review Question

User can manually enter a question inside a Review Session.

DragonMind creates a Node from that question and links it to:

- The Review Session.
- The primary Topic.

This path creates a Node directly and does not create a Guiding Question record in v0.1.2.

### 5.7 Topic Cadence Reminder

If a Topic has review cadence and is due, Discovery Feed can display:

> 该看这个议题了。

User confirmation is required before session creation.

No Task, Node, or Review Session should be auto-created by cadence alone.

---

## 6. API Design Direction

This section is a design direction, not implementation.

### 6.1 v0.1.2 Required API Subset

- `POST /topics`
- `GET /topics`
- `GET /topics/{id}`
- `PATCH /topics/{id}`
- `POST /review-sessions`
- `GET /review-sessions/{id}`
- `PATCH /review-sessions/{id}`
- `PATCH /review-sections/{id}`
- `GET /review-sessions/{id}/inputs`
- `POST /review-sessions/{id}/inputs`
- `DELETE /review-sessions/{id}/inputs/{input_id}`
- `POST /review-sessions/{id}/guiding-questions/generate`
- `GET /review-sessions/{id}/guiding-questions`
- `PATCH /review-guiding-questions/{id}/status`
- `POST /review-guiding-questions/{id}/convert-to-node`
- `POST /review-sessions/{id}/nodes`

Status endpoint rules:

- `PATCH /review-guiding-questions/{id}/status` only allows `suggested -> dismissed`.
- `converted` must be reached through `POST /review-guiding-questions/{id}/convert-to-node`.
- Do not allow a plain status patch to set `converted`.
- Do not allow `dismissed -> converted`.
- Do not allow `converted` to revert.

API boundaries:

- Guiding question generation must be deterministic / rule-based / heuristic first in v0.1.2.
- Guiding question generation must use only confirmed `review_session_input` records and current Review Section plain text.
- If an LLM is introduced later, it needs a separate implementation decision and must preserve the same object boundaries.
- No endpoint should auto-create Evidence from Knowledge.
- No endpoint should auto-scan the entire Knowledge library.
- No endpoint should scan the full Node store for guiding question generation.
- No endpoint should use RAG, embeddings, or semantic search in v0.1.2.

### 6.2 Future API

The following are future API directions and should not block v0.1.2 Foundation:

- Full Review Session list filters.
- Relation input support.
- Report generation.
- Desktop review workspace APIs.
- Advanced cadence APIs.
- Multi-Node report synthesis.

---

## 7. UI Direction

v0.1.2 can consider:

- Sidebar entry: `复盘议题`.
- Topic list.
- Topic detail.
- Review Session detail.
- Review Sections.
- Agent-suggested Guiding Questions.
- User input for creating a question Node.
- Review Session view showing linked Nodes and Knowledge Sources.

Mobile-first principles should remain:

- Low cognitive load.
- One primary judgment focus at a time.
- Advisor language, not database language.
- No project-management framing.

Not in v0.1.2 Foundation:

- Full desktop Review workspace.
- Report builder.
- Multi-Node report synthesis.
- Rich planning board.

---

## 8. Recommended v0.1.2 Foundation Scope

Recommended must-have scope:

- `topic`
- `review_session`
- `review_section`
- `review_guiding_question`
- `topic_link`
- `review_session_input`
- Node associated with Review Session through explicit input/link.
- Knowledge Source associated with Review Session through explicit input/link.
- Review Session belongs to exactly one primary Topic.
- Node and Knowledge Source can belong to multiple Topics.
- Agent can generate Guiding Questions with rationale.
- User can click a Guiding Question to create a Node.
- User can manually input a question to create a Node.
- Topic cadence can surface a Discovery Feed / Agent观察日报 hint.

Recommended optional within v0.1.2 only if low-risk:

- Basic Topic cadence field and next review date.
- Lightweight filter by Topic in Review Session detail.

Defer explicitly beyond v0.1.2:

- Section completion marker.
- `accepted` Guiding Question status.
- Topic multi-cadence UI.
- Global advanced Review Session filtering.
- Creating Review Sessions directly from Agent观察日报.
- Relation as Review Session input.
- Multi-Node report synthesis.
- Monthly report draft generation.
- Automatic next month plan generation.
- Desktop review workspace.
- RAG / embeddings / semantic search.

---

## 9. Explicitly Out of Scope

v0.1.2 Foundation should not include:

- Report generation.
- Automatic monthly report.
- Automatic next month plan.
- Automatic classification.
- Automatic session creation.
- Automatic Node creation.
- Automatic Task creation.
- Full desktop review workspace.
- RAG.
- Vector DB.
- Embeddings.
- Semantic search.
- Automatic fact judgment.
- Automatic Evidence creation.
- Knowledge auto-to-Evidence.
- Topic as project management.
- Topic as generic folder hierarchy.
- Review Session as a Node.
- Evidence attached directly to Topic or Review Session.
- Section completion marker.
- `accepted` Guiding Question status.
- Topic multi-cadence UI.
- Global advanced Review Session filtering.
- Creating Review Sessions directly from Agent观察日报.
- Relation as Review Session input.
- Multi-Node report synthesis.
- Monthly report draft generation.
- Automatic next month plan generation.
- Desktop review workspace.

---

## 10. Data Consistency Rules

Required consistency rules:

- `review_session.primary_topic_id` must point to an existing Topic.
- `review_section.session_id` must point to an existing Review Session.
- `review_guiding_question.session_id` must point to an existing Review Session.
- `review_guiding_question.created_node_id` must point to an existing Node when present.
- `review_guiding_question.status` allows only `suggested`, `dismissed`, `converted`.
- `review_guiding_question.created_node_id` is required when status is `converted`.
- `review_guiding_question` status transition allows only `suggested -> dismissed` or `suggested -> converted`.
- `topic_link.target_id` existence must be application-validated based on `target_type`.
- `topic_link` must be unique on `(topic_id, target_type, target_id)`.
- `review_session_input.target_id` existence must be application-validated based on `target_type`.
- `review_session_input` must be the only v0.1.2 source for Review Session aggregation.
- `review_session_input` must contain only user-confirmed inputs.
- `completed` Review Sessions should be immutable for generated Guiding Questions unless reopened support is explicitly designed later.

SQLite notes:

- Polymorphic targets require application-level validation.
- Unique indexes should prevent duplicate links.
- Avoid cascading deletes for core cognitive history.
- Archived / completed objects should be hidden by default only where product semantics require it.

---

## 11. Migration Direction

Suggested migration order:

1. `010_create_topic.sql`
2. `011_create_review_session.sql`
3. `012_create_review_section.sql`
4. `013_create_review_guiding_question.sql`
5. `014_create_topic_link.sql`
6. `015_create_review_session_input.sql`

No existing v0.1.1 table needs to be broken.

Avoid changing existing Node, Relation, Evidence, Knowledge, or Task semantics unless implementation proves a small nullable column is safer than a link table.

Preferred approach:

- Use link tables for Topic and Review Session associations.
- Preserve existing object ownership.

---

## 12. Acceptance Criteria

v0.1.2 Foundation is acceptable when:

1. User can create a Topic.
2. User can create a Review Session under a primary Topic.
3. Review Session has `period_start` and `period_end` as business period fields.
4. Review Session default sections are persisted as `review_section` records.
5. User can include selected Nodes in a Review Session.
6. User can include selected Knowledge Sources in a Review Session.
7. Review Session aggregation uses only confirmed inputs.
8. DragonMind can generate Guiding Questions with rationale from confirmed inputs using deterministic / rule-based / heuristic generation.
9. Guiding Questions do not create Nodes automatically.
10. User can convert a Guiding Question into a Node.
11. User can manually create a question Node from a Review Session.
12. Created Nodes are linked to the Review Session and primary Topic.
13. Evidence remains attached only to Node or Relation.
14. Knowledge chunks do not automatically become Evidence.
15. Topic cadence only surfaces a feed hint and does not auto-create Task, Node, or Review Session.
16. Existing v0.1.1 Knowledge and Evidence flows continue to work.
17. Guiding Question generation does not use full-library scanning, RAG, embeddings, semantic search, or automatic fact judgment.

---

## 13. Implementation Risks

### Risk: Topic becomes folder taxonomy

Mitigation:

- Keep Topic lifecycle and cadence focused on recurring review.
- Avoid nested Topics in v0.1.2.
- Do not use Topic as generic Knowledge classification.

### Risk: Review Session becomes a project board

Mitigation:

- No task automation.
- No kanban.
- No ownership or assignee fields.
- Keep sections as review structure, not execution tracking.

### Risk: Agent creates conclusions too early

Mitigation:

- Guiding Questions require rationale.
- Guiding Questions cannot contain final conclusions.
- Node creation requires user action.

### Risk: Review pulls in too much data

Mitigation:

- Only confirmed `review_session_input` records are aggregated.
- No full-library scan.
- No semantic search.

### Risk: Evidence boundary becomes blurry

Mitigation:

- Evidence remains only Node / Relation scoped.
- Knowledge Source inclusion in a Review Session is not Evidence.
- Review Session cannot own Evidence directly.

---

## 14. Decisions and Remaining Open Questions

### 14.1 v0.1.2 Decisions

These decisions are fixed for v0.1.2 Foundation:

1. Cadence:
   - v0.1.2 UI supports `monthly`.
   - The stored field may allow `quarterly`, but no special quarterly UI is required in v0.1.2.
2. Session creation entry:
   - Create Review Sessions from Topic detail first.
   - Discovery Feed / Agent观察日报 cadence hints deep-link to Topic detail.
   - Do not create Review Sessions directly from the feed in v0.1.2.
3. Section content:
   - Plain text only.
   - No rich text.
   - No completion marker.
4. Guiding Question conversion:
   - Converted Guiding Questions create `reasoning` Nodes by default.
5. Completed Review Sessions:
   - Completed Sessions are read-only in v0.1.2.
   - Reopen is not supported.
6. User-created review questions:
   - User-entered questions create Nodes directly.
   - They do not create `review_guiding_question` records.
7. Review Session input:
   - v0.1.2 supports only `node` and `knowledge_source`.
   - Relation input is deferred.

### 14.2 Remaining Open Questions

These can be decided during implementation without changing the core architecture:

1. Should Topic detail show only active Review Sessions by default, or all Sessions sorted by period?
2. Should Review Section default titles be stored in Chinese only for v0.1.2, or should `section_type` drive localized labels later?
3. Should Guiding Question generation run only on explicit button click, or also after adding confirmed inputs with a user-visible refresh action?

---

## 15. Development Recommendation

Do not enter implementation directly from this draft.

Recommended next step:

1. Run a focused architecture audit of this spec.
2. Resolve open questions in section 14.
3. Then implement v0.1.2 Foundation in a feature branch.

Suggested branch name:

`feature/v0.1.2-recurring-review-context`

---

## 16. Tag Safety

This spec does not require moving any existing tag.

Do not move:

- `v0.1-mvp`
- `v0.1.1`

v0.1.2 should be released as a new tag only after implementation and acceptance.
