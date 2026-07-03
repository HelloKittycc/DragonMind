# DragonMind v0.1.1 Knowledge UX Final Design

Status: Finalized design archive
Date: 2026-07-03
Figma file: `t2wtiGEcXgtlbwiy9JLQ8K`
Figma page: `DragonMind MVP Single Focus`

This document archives the finalized v0.1.1 Knowledge UX design. It records the newly added Knowledge and drawer states only. The existing A/B/C Single Focus pages are considered already finalized and should not be changed as part of this archive.

## Scope

Included:

- `D Knowledge UX - 外部依据`
- `D 文件选择弹窗`
- `D 已选择文件状态`
- `D 上传成功弹窗`
- `D 上传失败弹窗`
- `D 引用确认弹窗`
- `A/B/C 展开侧边栏 - 拼接态`

Excluded:

- `A 今日主问题首页`
- `B 帮我判断展开页`
- `C 可能模式展开页`

## Top-Level Frame Inventory

The Figma page should contain 12 top-level frames:

| Frame | Purpose | Size |
|---|---|---|
| `A 今日主问题首页` | Existing finalized main issue screen | 390 x 844 |
| `B 帮我判断展开页` | Existing finalized judgment screen | 390 x 844 |
| `C 可能模式展开页` | Existing finalized pattern screen | 390 x 844 |
| `D Knowledge UX - 外部依据` | Knowledge/evidence main screen | 390 x 844 |
| `A 展开侧边栏 - 拼接态` | Drawer opened over A | 390 x 844 |
| `B 展开侧边栏 - 拼接态` | Drawer opened over B | 390 x 844 |
| `C 展开侧边栏 - 拼接态` | Drawer opened over C | 390 x 844 |
| `D 文件选择弹窗` | File picker overlay state | 390 x 844 |
| `D 已选择文件状态` | Selected file state | 390 x 844 |
| `D 上传成功弹窗` | Upload success overlay state | 390 x 844 |
| `D 上传失败弹窗` | Upload failure overlay state | 390 x 844 |
| `D 引用确认弹窗` | Evidence attach confirmation state | 390 x 844 |

Backup or duplicate frames are not part of the final design.

## Visual Tokens

| Token | Value | Usage |
|---|---:|---|
| Background | `#FAFBF6` | Page background |
| Paper | `#FFFFFF` | Main cards, inputs, modal surfaces |
| Ink | `#1D2721` | Primary text |
| Muted | `#68766D` | Body text and helper text |
| Sage | `#416B5A` | Primary buttons, brand, menu button |
| Sage Soft | `#EEF5EF` | Knowledge input card and file drop zone |
| Sage Border | `#D2E1D5` | Soft green borders |
| Line | `#DDE5D9` | Neutral borders |
| Warm | `#F6F0E6` | Target node / citation area |
| Warm Border | `#E8DDC8` | Target node border |
| Warm Text | `#8F6937` | Target label |
| Modal Overlay | `#1D2721` at 16% opacity | Modal dim layer |

Typography uses system sans-serif / Inter-like rendering.

| Text Role | Size | Color |
|---|---:|---|
| Brand | 16 | `#416B5A` |
| Drawer brand | 22 | `#FFFFFF` or drawer foreground |
| Kicker | 13 | `#416B5A` |
| Main title | 25 | `#1D2721` |
| Intro/body | 15 | `#68766D` |
| Section label | 15 | `#1D2721` |
| Card title | 13 | `#1D2721` |
| Card excerpt | 11 | `#68766D` |
| Button text | 12-15 | Context dependent |

## Shared Header

All finalized mobile frames use the same top header language:

- Menu button: two horizontal bars, replacing the old `DM` square.
- Menu button size: `34 x 34`
- Menu button corner radius: `9`
- Long bar: `17 x 2`
- Short bar: `11 x 2`
- Bar color: `#FFFFFF`
- Menu button fill: `#416B5A`
- Brand text: `DragonMind`
- Date text remains on the right.

## D Screen: Knowledge UX - 外部依据

Frame name: `D Knowledge UX - 外部依据`

Purpose:

Let the user bring external material into DragonMind, search useful excerpts, and explicitly cite selected material to the current node as Evidence.

This screen must feel like part of DragonMind's advisor workflow, not a standalone knowledge base.

### Layout

| Element | X | Y | W | H | Style |
|---|---:|---:|---:|---:|---|
| Page frame | 0 | 0 | 390 | 844 | `#FAFBF6` |
| Menu button | 16 | 18 | 34 | 34 | `#416B5A`, radius 9 |
| Primary card | 16 | 78 | 358 | 666 | `#FFFFFF`, border `#DDE5D9`, radius 18 |
| Add source card | 33 | 246 | 322 | 118 | `#EEF5EF`, border `#D2E1D5`, radius 14 |
| Input field | 52 | 260 | 284 | 52 | `#FFFFFF`, border `#D2E1D5`, radius 8 |
| File picker button | 52 | 320 | 104 | 34 | `#416B5A`, radius 10 |
| Upload button | 178 | 320 | 60 | 34 | `#FFFFFF`, border `#D2E1D5`, radius 10 |
| Search input | 34 | 418 | 260 | 40 | `#FFFFFF`, border `#DDE5D9`, radius 12 |
| Search button | 302 | 418 | 54 | 40 | `#416B5A`, radius 12 |
| Results container | 34 | 474 | 322 | 164 | `#F7FAF8`, border `#DDE5D9`, radius 12 |
| Target node card | 34 | 654 | 322 | 74 | `#F6F0E6`, border `#E8DDC8`, radius 14 |
| Cite button | 284 | 663 | 56 | 24 | `#416B5A`, radius 9 |
| Node dropdown | 52 | 692 | 284 | 28 | `#FFFFFF`, border `#E8DDC8`, radius 9 |
| Bottom capture bar | 14 | 768 | 362 | 58 | `#FFFFFF`, border `#DDE5D9`, radius 16 |

Coordinates above are local to the 390 x 844 screen.

### Text

| Element | Text |
|---|---|
| Kicker | `资料与证据` |
| Title | `把判断需要的资料放进来` |
| Intro | `DragonMind 不会替你下结论，只会把资料片段整理成可引用的依据。` |
| Source input body | `粘贴会议纪要，或上传 PDF、Word、PPT、Excel 等资料。` |
| File picker button | `选择文件` |
| Upload button | `上传` |
| Search label | `查找依据` |
| Search placeholder | `搜索渠道、转化率、会议纪要……` |
| Search button | `搜索` |
| Target label | `引用到当前线索` |
| Node dropdown value | `渠道转化下滑` |
| Cite button | `引用` |
| Bottom capture title | `灵光一闪` |
| Bottom capture helper | `我会判断它是否值得继续追踪` |

### Search Result Example Rows

| Source title | Tag | Excerpt |
|---|---|---|
| `渠道会议纪要` | `会议纪要` | `商务渠道转化率连续两周下滑，集中在拓科渠道阶段。` |
| `渠道复盘报告 Q2` | `分析报告` | `拓科渠道转化率从4.2%降至2.8%，与决策周期不匹配。` |
| `大客户线索分析` | `CSV 数据` | `大客户线索量增加17%，但成单率同比下降9%。` |

The results container is fixed-height and scrollable when results exceed available space.

## D State: File Picker Modal

Frame name: `D 文件选择弹窗`

Purpose:

Show a lightweight native-feeling file selection overlay after the user clicks `选择文件`.

### Overlay

| Element | X | Y | W | H | Style |
|---|---:|---:|---:|---:|---|
| Modal overlay | 0 | 0 | 390 | 844 | `#1D2721`, 16% opacity |
| File picker modal | 34 | 363 | 322 | 119 | `#FFFFFF`, border `#DDE5D9`, radius 18 |
| Drop zone | 58 | 390 | 250 | 33 | `#EEF5EF`, border `#D2E1D5`, radius 14 |

### Text

| Element | Text |
|---|---|
| Drop zone | `+ 选择本地文件` |
| Supported types | `支持 PDF、Word、PPT、Excel、文本文件` |

Implementation note:

This is a visual design state. The actual v0.1.1 backend supports only the file types defined in the Knowledge Ingestion spec and implementation. If product copy and backend support diverge, implementation should either update copy or broaden backend in a later scoped change.

## D State: Selected File

Frame name: `D 已选择文件状态`

Purpose:

Return to the main D screen after file selection and show selected file in the source input area.

Changed text:

| Element | Text |
|---|---|
| Source input body | `已选择：渠道复盘报告 Q2.pdf` |

All other layout metrics match `D Knowledge UX - 外部依据`.

## D State: Upload Success

Frame name: `D 上传成功弹窗`

Purpose:

Confirm that a material import completed and that the user can now search and cite chunks.

### Overlay

| Element | X | Y | W | H | Style |
|---|---:|---:|---:|---:|---|
| Modal overlay | 0 | 0 | 390 | 844 | `#1D2721`, 16% opacity |
| Upload success modal | 34 | 324 | 322 | 196 | `#FFFFFF`, border `#DDE5D9`, radius 18 |
| Confirm button | 220 | 461 | 88 | 36 | Button background |

### Text

| Element | Text |
|---|---|
| Label | `上传成功` |
| Body | `资料已导入。DragonMind 已把它整理成可搜索、可引用的片段。` |
| Confirm | `知道了` |

## D State: Upload Failure

Frame name: `D 上传失败弹窗`

Purpose:

Show a human-readable upload failure without exposing backend stack traces.

### Overlay

| Element | X | Y | W | H | Style |
|---|---:|---:|---:|---:|---|
| Modal overlay | 0 | 0 | 390 | 844 | `#1D2721`, 16% opacity |
| Upload failure modal | 34 | 324 | 322 | 196 | `#FFFFFF`, border `#DDE5D9`, radius 18 |
| Cancel button | 58 | 466 | 104 | 40 | Secondary action |
| Retry button | 176 | 466 | 122 | 40 | Primary/secondary action |

### Text

| Element | Text |
|---|---|
| Label | `上传失败` |
| Body | `可能是文件过大、格式暂不支持，或内容无法读取。你可以换一个文件，或者先粘贴关键内容。` |
| Cancel | `取消` |
| Retry | `重新选择` |

## D State: Citation Confirmation

Frame name: `D 引用确认弹窗`

Purpose:

Require explicit confirmation before turning a selected material chunk into Evidence.

### Overlay

| Element | X | Y | W | H | Style |
|---|---:|---:|---:|---:|---|
| Modal overlay | 0 | 0 | 390 | 844 | `#1D2721`, 16% opacity |
| Citation confirm modal | 34 | 296 | 322 | 252 | `#FFFFFF`, border `#DDE5D9`, radius 18 |
| Cancel button | 58 | 490 | 104 | 40 | Secondary action |
| Confirm button | 195 | 490 | 122 | 40 | Primary action |

### Text

| Element | Text |
|---|---|
| Title | `确认引用这条依据？` |
| Status | `结果状态：将把“渠道会议纪要”引用到当前线索。` |
| Body | `确认后，这段资料会用于支持、反驳或补充当前判断。点击取消则不引用。` |
| Cancel | `取消` |
| Confirm | `确认引用` |

Behavior:

- `取消` closes the modal and does not create Evidence.
- `确认引用` creates Evidence for the selected chunk and target node.
- Evidence creation remains explicit. Knowledge chunks must not be converted to Evidence automatically.

## Side Drawer Expanded States

Frames:

- `A 展开侧边栏 - 拼接态`
- `B 展开侧边栏 - 拼接态`
- `C 展开侧边栏 - 拼接态`

Purpose:

Show the GPT-like left drawer opened over the existing A/B/C pages. The original page is shifted right and remains visually attached to the drawer.

### Drawer Layout

| Element | X | Y | W | H |
|---|---:|---:|---:|---:|
| Drawer area | 0 | 0 | approx. 292 | 844 |
| Spark button local mask | 0 | 756 | 292 | 88 |
| Spark capture button | 24 | 780 | 141 | 44 |

### Drawer Text

| Section | Text |
|---|---|
| Brand | `DragonMind` |
| Main link | `观察日报` |
| Section heading | `工作区` |
| Filters | `待处理`, `进行中`, `决策`, `全部` |
| Section heading | `线索` |
| Node rows | `渠道转化下滑`, `拓科渠道转化下滑`, `转介绍转化下滑`, `Day3 API Smoke Spark`, `Day2 smoke Spark`, `Day3 Alpha`, `拓科渠道转化下滑`, `转介绍渠道例子量骤减` |
| Extra link | `资料与证据` |
| Fixed bottom button | `+ 灵光一闪` |

### Drawer Rules

- Drawer text should not sit inside visible boxes.
- Filter rows and node rows are clickable in implementation.
- Node rows show node title only; raw node IDs are not displayed.
- Long node lists scroll vertically.
- `灵光一闪` remains fixed at the bottom and does not scroll with the node list.
- The drawer should feel like navigation into DragonMind's advisor context, not a management dashboard.

## Implementation Mapping

| Design Element | Existing v0.1.1 Functionality |
|---|---|
| `选择文件` | Opens file picker and stores selected file in local UI state |
| `上传` | Calls file upload API if file selected, or paste import API if pasted content is present |
| `查找依据` | Calls knowledge chunk search |
| Search result row | Represents one knowledge chunk and source display metadata |
| `引用到当前线索` dropdown | Selects target node, defaulting to current node |
| `引用` | Opens citation confirmation modal |
| `确认引用` | Calls chunk-to-evidence API |
| `取消` | Closes modal without persistence |
| Upload success modal | Human-readable import success state |
| Upload failure modal | Human-readable import failure state |
| Drawer filters | Map to existing workspace filters |
| Drawer node rows | Link to node detail pages |
| Drawer `灵光一闪` | Opens existing Spark capture modal |

## Product Boundaries

The final design must preserve these v0.1.1 boundaries:

- Knowledge is background material, not a Node.
- Knowledge does not enter the Relation graph.
- Importing Knowledge does not create Tasks.
- Knowledge chunks do not become Evidence automatically.
- Evidence must be explicitly attached to a Node or Relation.
- No RAG.
- No Vector DB.
- No embeddings.
- No semantic search.
- No automatic fact judgment.
- No Concept / Insight / Attention Pattern.
- No cloud sync.
- No multi-user features.

## Finalization Notes

- Figma itself auto-saves the visual frames.
- This document is the repository-side design archive for the new v0.1.1 Knowledge UX screens.
- Existing A/B/C pages are intentionally not restated as new design scope here.
- Duplicate backup frames were removed before this archive was written.
