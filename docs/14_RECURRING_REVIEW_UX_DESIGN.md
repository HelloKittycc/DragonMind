# DragonMind v0.1.2 Recurring Review UX Design

Status: Finalized design archive

Date: 2026-07-13

Figma file: `t2wtiGEcXgtlbwiy9JLQ8K`

Figma page: `DragonMind MVP Single Focus`

Spec source: `docs/13_RECURRING_REVIEW_CONTEXT_SPEC.md`

This document archives the finalized v0.1.2 Recurring Review Context mobile UX design after manual Figma adjustments. It records only the recurring review UI surfaces and drawer changes. Existing v0.1.1 Single Focus pages and Knowledge pages remain outside this archive unless explicitly referenced by the drawer.

## Scope

Included:

- `F 复盘议题详情`
- `G 本月复盘详情`
- `I 纳入复盘材料`
- `J 引导问题展开态`
- `L 侧边栏新增复盘议题拼接态`

Removed from the v0.1.2 recurring review UI scope:

- `E 复盘议题列表`
- `H 新建复盘弹窗`
- `K 观察日报复盘提醒态`

Reasoning:

- Topic list belongs in the side drawer, not as a separate primary screen.
- Monthly Review Sessions are automatically prepared on the 1st of each month, so manual session creation is not a primary UX path.
- Recurring review cadence should not occupy the Agent观察日报 main issue slot. Agent观察日报 remains focused on single-event importance.

## Product Positioning

This UX is for Recurring Review Context, not project management, not a database, and not a generic knowledge workspace.

DragonMind acts as a review advisor:

- It prepares the recurring review context.
- It helps the user confirm which materials and judgments are included.
- It helps decompose goals into metrics, deviations, and question points.
- It proposes guiding questions with rationale.
- It only creates a judgment Node after the user explicitly confirms.

DragonMind does not:

- Automatically write monthly reports.
- Automatically create conclusions.
- Automatically generate next-month plans.
- Automatically scan all Knowledge or Nodes.
- Automatically create Evidence, Nodes, Tasks, or Review Sessions from cadence alone.
- Introduce Conversation, RAG, Vector DB, embeddings, or semantic search.

## Frame Inventory

| Frame | Node ID | Purpose | Size |
|---|---|---|---|
| `F 复盘议题详情` | `589:2` | Topic detail and current monthly review entry | 390 x 844 |
| `G 本月复盘详情` | `589:41` | Current Review Session detail | 390 x 844 |
| `I 纳入复盘材料` | `589:94` | Manage included and searchable review inputs | 390 x 844 |
| `J 引导问题展开态` | `597:2` | Expand an Agent guiding question inside the review context | 390 x 844 |
| `L 侧边栏新增复盘议题拼接态` | `558:2` | Drawer with recurring review entry | 390 x 844 |

## Shared Visual System

The recurring review screens continue DragonMind v0.1.1 Single Focus visual language.

| Token | Value | Usage |
|---|---:|---|
| Background | `#FAFBF6` | Page background |
| Paper | `#FFFFFF` | Main cards, drawers, input surfaces |
| Ink | `#1D2721` | Primary text |
| Muted | `#68766D` | Secondary text |
| Sage | `#416B5A` | Brand, primary actions, menu button |
| Sage Soft | `#EEF5EF` | Current session, guiding question, soft highlight |
| Sage Border | `#D2E1D5` | Soft highlight borders |
| Line | `#DDE5D9` | Neutral card borders |
| Warm | `#F6F0E6` | Advisor note / boundary note |
| Warm Border | `#E8DDC8` | Advisor note border |
| Warm Text | `#8F6937` | Advisor note label |

Typography:

| Role | Size | Style | Color |
|---|---:|---|---|
| Brand | 17 | Bold | `#416B5A` |
| Screen kicker | 13 | Semi Bold | `#416B5A` |
| Main title | 24-25 | Bold | `#1D2721` |
| Section title | 15 | Semi Bold | `#1D2721` |
| Body | 14-15 | Regular | `#68766D` |
| Card title | 12-13 | Medium / Semi Bold | `#1D2721` |
| Card meta | 10-12 | Regular | `#68766D` |

Shared header:

- Menu button: `34 x 34`, corner radius `9`, fill `#416B5A`.
- Two menu bars: long `17 x 2`, short `11 x 2`, fill `#FFFFFF`.
- Brand text: `DragonMind`.
- Date text on the right.

Shared bottom capture:

- Title: `灵光一闪`
- Helper: `我会判断它是否值得继续追踪`
- Plus button remains secondary to the review surface.

## F Screen: 复盘议题详情

Frame name: `F 复盘议题详情`

Purpose:

Show one long-lived recurring review topic and the automatically prepared current monthly review entry.

This screen replaces a generic Topic list. Topic list access belongs to the drawer.

### Content

| Element | Text / Behavior |
|---|---|
| Kicker | `复盘议题` |
| Title | `月度经营复盘` |
| Intro | `每月 1 号，DragonMind 会自动准备当月复盘。你可以在月中随时纳入资料、记录异常、拆出问题。` |
| Current entry title | `2026 年 7 月经营复盘` |
| Current entry action tag | `进入复盘` |
| Current entry helper | `覆盖周期：2026.07.01 - 2026.07.31` |
| History section | `历史复盘` |

### Key Layout

| Element | X | Y | W | H | Notes |
|---|---:|---:|---:|---:|---|
| Primary card | 16 | 78 | 358 | 650 | White card |
| Current session card | 34 | 271 | 322 | 124 | Sage soft card |
| History review scroll container | 34 | 468 | 322 | 222 | Fixed-height scroll container |

### History Review List

The history list is a scrollable container with repeated review rows. Current examples:

| Review | Summary |
|---|---|
| `2026年3月经营复盘` | `目标达成率 87%，渠道拓展进度滞后` |
| `2026年4月经营复盘` | `影响达成的主因：大客户签约周期延长` |
| `2026年5月经营复盘` | `目标达成率 103%，超额完成季度指标` |
| `2026年6月经营复盘` | `影响达成的主因：新产品线推进缓慢` |

Design details:

- Each row uses a white background inside the scroll container.
- Each row has a `#416B5A` accent bar on the left.
- A visible scrollbar is shown in the design state.

Behavior:

- The current month review entry is prepared automatically every month.
- Users enter the current monthly review from this screen.
- Users do not manually create the monthly review in v0.1.2 UI.

## G Screen: 本月复盘详情

Frame name: `G 本月复盘详情`

Purpose:

Show one concrete Review Session. The screen is not a report editor. It helps the user decompose goals, metrics, deviations, included inputs, and guiding questions.

### Content

| Element | Text / Behavior |
|---|---|
| Kicker | `本月复盘` |
| Title | `2026 年 7 月经营复盘` |
| Meta | `业务周期：2026.07.01 - 2026.07.31 · 复盘中` |
| Advisor note label | `我的提醒` |
| Advisor note body | `先把目标拆到指标，再把偏差拆到问题点。不要直接写结论。` |
| Structure label | `复盘结构` |
| Included inputs label | `已纳入资料 / 判断` |
| Input management action | `管理输入` |
| Included input summary | `资料 2 份 · 判断 1 条 · 只使用你确认纳入的内容` |
| Guiding question label | `值得分析的问题` |
| Guiding question | `拓科渠道转化率下降是否已经成为趋势？` |
| Guiding question source | `来自：渠道收入偏差、渠道会议纪要` |

### Metric Decomposition

The `复盘结构` area is a fixed-height scroll container. It represents hierarchical decomposition, not a simple checklist.

Current example structure:

| Level | Item | Detail | Tag |
|---:|---|---|---|
| 0 | `收入目标 1200 万` | `完成 930 万 · 差 270 万` | `偏差` |
| 1 | `渠道收入 620 万` | `完成 430 万 · 差 190 万` | `偏差` |
| 2 | `拓科渠道` | `转化率 2.8%，低于目标 4.2%` | `问题点` |
| 2 | `大客户线索` | `线索量上升，成单率下降` | `问题点` |
| 1 | `续费收入 380 万` | `完成 365 万 · 接近目标` | `正常` |
| 2 | `交付延期` | `影响 2 个重点客户回款` | `问题点` |

Design intent:

- Goal review must support multiple metrics.
- Metrics can be decomposed into lower-level issue points.
- The UI should reveal which deviations are worth turning into guiding questions.
- This is still not a report generator and not an automatic conclusion surface.

### Key Layout

| Element | X | Y | W | H |
|---|---:|---:|---:|---:|
| Primary card | 16 | 78 | 358 | 650 |
| Metric decomposition scroll container | 34 | 356 | 322 | 172 |
| Included input summary | 34 | 578 | 322 | 48 |
| Guiding question preview | 34 | 678 | 322 | 58 |

Behavior:

- `管理输入` opens `I 纳入复盘材料`.
- Clicking a guiding question opens `J 引导问题展开态`.
- Evidence is not attached directly to the Review Session.
- Only user-confirmed included inputs are used.

## I Screen: 纳入复盘材料

Frame name: `I 纳入复盘材料`

Purpose:

Allow the user to manage the Node / Knowledge Source inputs explicitly included in the current Review Session.

This is not a global Knowledge workspace. It is a session-scoped input manager.

### Content

| Element | Text / Behavior |
|---|---|
| Title | `纳入复盘材料` |
| Body | `只会纳入你确认选择的内容。DragonMind 不会自动扫描全部资料。` |
| Included section | `已纳入` |
| Search section | `搜索并选择纳入` |
| Search placeholder | `搜索渠道、转化率、会议纪要……` |
| Search button | `搜索` |
| Cancel action | `取消` |
| Confirm action | `确认纳入` |

### Included Inputs

The included area is a scroll container with removable items.

Current examples:

- `资料：渠道复盘会议纪要`
- `判断：拓科渠道转化下降`

Design details:

- Each included row can expose a small `×` remove affordance.
- Removing an item should remove it from the current Review Session input set only.
- Removing an item must not delete the original Node or Knowledge Source.

### Search And Select Inputs

Search results are a fixed-height scroll container and use checkboxes for multi-select.

Current examples:

| Result | Excerpt |
|---|---|
| `渠道复盘报告 Q2` | `拓科渠道转化率从4.2%降至2.8%……` |
| `商务渠道复盘判断` | `商务渠道关键节点复盘，含判断与建议……` |

Behavior:

- Users search existing Nodes / Knowledge Sources.
- Users select one or more results.
- `确认纳入` should open a confirmation step or apply the selected inputs after explicit confirmation, depending on final implementation detail.
- The system must not auto-scan all materials into the session.
- `source = agent_suggestion` still requires user confirmation before the record enters `review_session_input`.

### Key Layout

| Element | X | Y | W | H |
|---|---:|---:|---:|---:|
| Underlying card | 16 | 78 | 358 | 650 |
| Included items scroll container | 48 | 282 | 294 | 94 |
| Search input | 48 | 438 | 226 | 40 |
| Search result scroll container | 48 | 494 | 294 | 139 |
| Footer actions | 48 / 206 | 644 | 92 / 120 | 40 |

## J Screen: 引导问题展开态

Frame name: `J 引导问题展开态`

Purpose:

Show what happens after the user taps an Agent-generated guiding question inside the Review Session.

This is not a Conversation module and not a direct jump to Node Detail.

The user stays in the Review Session context, sees why DragonMind raised the question, reviews the proposed analysis frame, optionally adds context, and only then decides whether to create a judgment.

### Content

| Element | Text / Behavior |
|---|---|
| Kicker | `展开这个问题` |
| Title | `拓科渠道转化率下降是否已经成为趋势？` |
| Context | `来自：2026 年 7 月经营复盘 · 渠道收入偏差` |
| Rationale label | `我为什么提出它` |
| Rationale body | `渠道收入低于目标，且会议纪要显示拓科渠道连续两周下滑。这个问题需要被单独判断，而不是直接写进月报结论。` |
| Analysis label | `先这样分析` |
| Step 1 | `先确认下降是否连续超过一个业务周期。` |
| Step 2 | `再判断是否只发生在拓科，还是渠道整体问题。` |
| Step 3 | `最后看它是否影响下月预算和销售动作。` |
| User supplement label | `你的补充` |
| User supplement placeholder | `补充你看到的情况，或说明你不同意这个问题……` |
| Boundary note | `只有点击“创建判断”后，才会生成一条可继续展开的判断线索。` |
| Secondary action | `暂不展开` |
| Primary action | `创建判断` |

Behavior:

- Opening this page does not create a Node.
- User supplement can remain UI-local until the user confirms creation.
- Clicking `创建判断` creates a reasoning Node from the guiding question.
- The created Node is linked to the Review Session through `review_session_input`.
- The created Node is linked to the primary Topic through `topic_link`.
- The guiding question status becomes `converted`.
- `created_node_id` is set.
- No Evidence is created automatically.

## L Screen: 侧边栏新增复盘议题拼接态

Frame name: `L 侧边栏新增复盘议题拼接态`

Purpose:

Show the existing GPT-like drawer with the new recurring review entry added. The drawer style must match the A/B/C drawer system.

### Drawer Structure

| Level | Text |
|---|---|
| Brand | `DragonMind` |
| Primary | `观察日报` |
| Primary | `工作区` |
| Secondary | `待处理` |
| Tertiary | `拓科渠道转化下降` |
| Tertiary | `渠道转化下滑` |
| Secondary | `进行中` |
| Tertiary | `入口形态影响产品气质` |
| Secondary | `决策` |
| Tertiary | `DragonMind 主入口判断` |
| Secondary | `全部` |
| Primary | `复盘议题` |
| Secondary | `月度经营复盘` |
| Secondary | `渠道质量观察` |
| Primary | `资料与证据` |
| Fixed bottom action | `+ 灵光一闪` |

Design rules:

- No standalone `线索` primary section.
- Clues appear inside `工作区` as third-level rows under workspace filters.
- Drawer background is white.
- Primary drawer rows use 16px Bold `#1D2721`.
- Secondary / tertiary rows use 15px Regular `#68766D`.
- `灵光一闪` stays fixed at the bottom.

Implementation note:

- The Figma shifted preview currently still uses a recurring-review reminder style on the right side. During frontend implementation, use the real current page preview/attached content instead of preserving a stale `K`-style preview label.
- Workspace filter rows should expand/collapse in code. Figma only records the expanded structural state.

## Navigation And Flow

Recommended user flow:

1. Open drawer.
2. Tap `复盘议题`.
3. Enter `F 复盘议题详情`.
4. Tap `进入复盘`.
5. Enter `G 本月复盘详情`.
6. Tap `管理输入`.
7. Enter `I 纳入复盘材料`.
8. Confirm included Nodes / Knowledge Sources.
9. Return to `G`.
10. Tap a guiding question.
11. Enter `J 引导问题展开态`.
12. Tap `创建判断` only if the question should become a reasoning Node.

## Backend Mapping

| UI Element | Backend Object / API Direction |
---|---|
| `复盘议题` drawer row | `topic` list / detail |
| `月度经营复盘` | `topic.title` |
| `2026 年 7 月经营复盘` | `review_session.title` |
| Business period | `review_session.period_start`, `review_session.period_end` |
| Metric decomposition | `review_section.content` plain text plus frontend display grouping |
| `管理输入` | `review_session_input` management |
| Included Knowledge Source | `review_session_input.target_type = knowledge_source` |
| Included Node | `review_session_input.target_type = node` |
| Guiding question preview | `review_guiding_question` |
| `创建判断` | `POST /review-guiding-questions/{id}/convert-to-node` |

## Explicit Boundaries

The v0.1.2 UX must preserve these boundaries:

- Topic is not a project.
- Topic is not a folder taxonomy.
- Review Session is not a Node.
- Review Section is plain text / structure, not a conclusion.
- Review Section does not automatically create Evidence or Nodes.
- Guiding Question does not automatically create a Node.
- Guiding Question does not answer itself.
- Knowledge Source inclusion is not Evidence.
- Evidence remains attached only to Node or Relation.
- No automatic monthly report.
- No automatic next-month plan.
- No automatic classification.
- No RAG.
- No Vector DB.
- No embeddings.
- No semantic search.
- No full-library scan.
- No automatic fact judgment.

## Implementation Notes For Day 3

1. Do not implement `E`, `H`, or `K` screens.
2. Implement the drawer recurring review entry and workspace clue nesting.
3. Implement `F`, `G`, `I`, and `J` as the v0.1.2 minimal UI.
4. Monthly Review Session creation should be system-prepared on the 1st of each month or represented as an already-prepared entry in v0.1.2 UI. Do not expose manual creation as the main path.
5. `I 纳入复盘材料` should support included input removal and multi-select search results.
6. `J 引导问题展开态` should not create a Node on open.
7. `创建判断` is the explicit conversion action.
8. Any UI-local user supplement entered on `J` should be attached to the created Node only after conversion, if implemented.
9. Fix the stale shifted-preview naming/content in `L` during frontend implementation.

