# DragonMind MVP Single Focus Frontend Design

Source Figma file: https://www.figma.com/design/t2wtiGEcXgtlbwiy9JLQ8K

Figma page: `DragonMind MVP Single Focus`

This document records the current single-focus mobile frontend design. It is a design handoff note, not a database schema change.

## Product Mindset

DragonMind should feel like a quiet personal advisor, not a task manager, note app, or module dashboard.

The MVP mobile experience has one primary job:

> Show the user the single most important issue DragonMind thinks is worth judging today.

Background capabilities such as judging, reviewing, and pattern detection should appear as advisor behaviors, not as top-level product modules.

## Shared Mobile Shell

All three screens use the same mobile frame:

| Element | Current Text / Behavior |
|---|---|
| Brand mark | `DM` |
| Brand name | `DragonMind` |
| Date | `2026年6月26日` |
| Bottom capture title | `灵光一闪` |
| Bottom capture helper | `我会判断它是否值得继续追踪` |
| Plus button | Opens Spark capture page later; this expanded capture page is intentionally deferred |

Visual direction:

| Attribute | Direction |
|---|---|
| Color | Soft sage green, warm white, low contrast borders |
| Layout | Mobile-first, card-based, generous whitespace |
| Tone | Advisor language, not system/module language |
| Navigation | No five-tab navigation; no Brief / Decide / Review / Patterns / Capture nav |

## Visual Specification

All values below are implementation targets derived from the current Figma page. Use these numeric values instead of interpreting the visual style by adjective.

### Canvas

| Token | Value |
|---|---:|
| Mobile frame width | `390px` |
| Mobile frame height | `844px` |
| Page background | `#FAFBF6` |
| Content safe margin left/right | `16px` for main cards, `14px` for bottom capture |
| Primary card x | `16px` |
| Primary card y | `78px` |
| Primary card width | `358px` |
| Primary card corner radius | `18px` |
| Primary card border | `1px solid #DDE5D9` |
| Primary card fill | `#FFFFFF` |

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `color.bg` | `#FAFBF6` | Screen background |
| `color.paper` | `#FFFFFF` | Cards, input bar, modals |
| `color.line` | `#DDE5D9` | Default border |
| `color.ink` | `#1D2721` | Primary text |
| `color.muted` | `#68766D` | Secondary text |
| `color.sage` | `#5F8A76` | Evidence bullets, medium emphasis |
| `color.sageDeep` | `#416B5A` | Brand mark, primary button, section labels |
| `color.sageSoft` | `#EEF5EF` | Soft highlight surfaces |
| `color.sageBorder` | `#D2E1D5` | Soft highlight border |
| `color.warm` | `#F6F0E6` | Recommendation / next-step card fill |
| `color.warmBorder` | `#E8DDC8` | Recommendation / next-step card border |
| `color.overlay` | `rgba(29, 39, 33, 0.12)` | Source modal overlay |
| `color.acceptOverlay` | `rgba(29, 39, 33, 0.18)` | Accept suggestion modal overlay |

### Typography

| Text Role | Size | Weight | Line Height | Color |
|---|---:|---|---:|---|
| Brand name | `16px` | `700` | `136%` | `#416B5A` |
| Date | `12px` | `400` | `136%` | `#68766D` |
| Page kicker / small label | `13px` | `700` | `136%` | `#416B5A` |
| Main issue title | `25px` | `700` | `136%` | `#1D2721` |
| Main page body | `15px` | `400` | `136%` | `#68766D` |
| Section title | `15-16px` | `700` | `136%` | `#1D2721` |
| Card body | `13px` | `400` | `136%` | `#1D2721` or `#68766D` |
| Button text | `13px` | `700` | `136%` | `#FFFFFF` or `#416B5A` |
| Bottom capture title | `15px` | `700` | `136%` | `#1D2721` |
| Bottom capture helper | `11px` | `400` | `136%` | `#68766D` |
| Modal title | `19-20px` | `700` | `136%` | `#1D2721` |
| Modal body | `13px` | `400` | `136%` | `#68766D` |

Font family target: system sans-serif in implementation. Figma currently uses Inter.

### Header

| Element | x | y | w | h | Style |
|---|---:|---:|---:|---:|---|
| Brand mark background | `16px` | `18px` | `34px` | `34px` | fill `#416B5A`, radius `9px` |
| `DM` text | `23px` | `28px` | `22px` | `14px` | `10px`, weight `700`, color `#FFFFFF` |
| `DragonMind` text | `60px` | `25px` | `170px` | `22px` | `16px`, weight `700`, color `#416B5A` |
| Date text | `272px` | `27px` | `105px` | `16px` | `12px`, color `#68766D` |

### Bottom Capture Bar

| Element | x | y | w | h | Style |
|---|---:|---:|---:|---:|---|
| Capture bar | `14px` | `768px` | `362px` | `58px` | fill `#FFFFFF`, border `#DDE5D9`, radius `16px` |
| Capture title | `32px` | `778px` | `230px` | `20px` | `灵光一闪` |
| Capture helper | `32px` | `801px` | `230px` | `15px` | `我会判断它是否值得继续追踪` |
| Plus button background | `324px` | `782px` | `34px` | `34px` | fill `#416B5A`, radius `10px` |
| Plus text | `332px` | `787px` | `18px` | `24px` | `+`, color `#FFFFFF` |

Behavior: tapping plus opens the Spark capture page later. The expanded capture page is intentionally not part of this design handoff.

### Buttons

| Button Type | Height | Radius | Border | Fill | Text |
|---|---:|---:|---|---|---|
| Primary action | `42px` | `12px` | `#416B5A` | `#416B5A` | `13px`, weight `700`, `#FFFFFF` |
| Secondary action | `42px` | `12px` | `#DDE5D9` | `#FFFFFF` | `13px`, weight `700`, `#416B5A` |
| Source modal close | `36px` | `10px` | `#416B5A` | `#416B5A` | `12px`, weight `700`, `#FFFFFF` |
| Modal cancel | `40px` | `12px` | `#DDE5D9` | `#FFFFFF` | `13px`, weight `700`, `#416B5A` |
| Modal confirm | `40px` | `12px` | `#416B5A` | `#416B5A` | `13px`, weight `700`, `#FFFFFF` |

### Scroll Containers

Evidence and reason/rationale lists must use internal scrolling when content exceeds the fixed container height.

| Screen | Container Name | x | y | w | h | Overflow |
|---|---|---:|---:|---:|---:|---|
| A | `证据滚动容器` | `28px` | `430px` | `334px` | `156px` | vertical scroll |
| B | `证据滚动容器` | `28px` | `354px` | `334px` | `156px` | vertical scroll |
| C | `证据滚动容器` | `28px` | `328px` | `334px` | `169px` | vertical scroll |

List item target:

| Item Attribute | Value |
|---|---:|
| Item width | `334px` |
| Item min height | `48px` |
| Item horizontal padding | `26px` left text offset inside container |
| Bullet size | `8px x 8px` |
| Bullet color | `#5F8A76` |
| Item text width | `292px` |
| Item text size | `13px` |
| Item row gap | `8-12px` |
| Click target | Entire item row, not a separate `查看来源` button |

### Source Modal

Used when tapping a source/evidence/rationale item.

| Element | x | y | w | h | Style |
|---|---:|---:|---:|---:|---|
| Overlay | `0px` | `0px` | `390px` | `844px` | fill `rgba(29, 39, 33, 0.12)` |
| Modal card | `34px` | `293px` | `322px` | `258px` | fill `#FFFFFF`, border `#DDE5D9`, radius `18px` |
| Label | `58px` | `321px` | `120px` | `18px` | `13px`, weight `700`, `#416B5A` |
| Title | `58px` | `351px` | `250px` | dynamic | `19px`, weight `700`, `#1D2721` |
| Body | `58px` | `401px` | `250px` | dynamic | `13px`, weight `400`, `#68766D` |
| Source | `58px` | `467px` | `250px` | `16px` | `12px`, weight `700`, `#416B5A` |
| Close button | `220px` | `501px` | `88px` | `36px` | fill `#416B5A`, radius `10px` |
| Close text | `244px` | `511px` | `50px` | `16px` | `知道了` |

### Accept Suggestion Modal

Used when tapping `接受建议` on Screen B.

| Element | x | y | w | h | Style |
|---|---:|---:|---:|---:|---|
| Overlay | `0px` | `0px` | `390px` | `844px` | fill `rgba(29, 39, 33, 0.18)` |
| Modal card | `34px` | `303px` | `322px` | `238px` | fill `#FFFFFF`, border `#DDE5D9`, radius `18px` |
| Title | `58px` | `331px` | `250px` | `27px` | `已准备接受这条建议` |
| Status | `58px` | `379px` | `250px` | `38px` | `结果状态：将把“不要继续使用多页面导航”记入当前判断。` |
| Body | `58px` | `427px` | `250px` | `54px` | confirmation explanation |
| Cancel button | `58px` | `483px` | `104px` | `40px` | secondary |
| Confirm button | `176px` | `483px` | `122px` | `40px` | primary |

### Screen-Specific Layout Values

#### Screen A

| Element | x | y | w | h |
|---|---:|---:|---:|---:|
| Primary card | `16px` | `78px` | `358px` | `626px` |
| Kicker | `34px` | `102px` | `260px` | `18px` |
| Main issue title | `34px` | `128px` | `312px` | `68px` |
| One-line judgment | `34px` | `204px` | `310px` | `60px` |
| Why card | `34px` | `284px` | `322px` | `88px` |
| Why label | `52px` | `299px` | `260px` | `19px` |
| Why body | `51px` | `324px` | `282px` | `36px` |
| Evidence label | `34px` | `400px` | `260px` | `20px` |
| Evidence scroll container | `28px` | `430px` | `334px` | `156px` |
| Recommendation card | `34px` | `604px` | `322px` | `80px` |
| Recommendation label | `54px` | `616px` | `120px` | `18px` |
| Recommendation body | `54px` | `641px` | `278px` | `32px` |
| Button 1 | `34px` | `716px` | `96px` | `42px` |
| Button 2 | `142px` | `716px` | `96px` | `42px` |
| Button 3 | `250px` | `716px` | `106px` | `42px` |

#### Screen B

| Element | x | y | w | h |
|---|---:|---:|---:|---:|
| Primary card | `16px` | `78px` | `358px` | `602px` |
| Page label | `34px` | `104px` | `200px` | `18px` |
| Question | `34px` | `134px` | `312px` | `70px` |
| Recommendation card | `33px` | `222px` | `322px` | `72px` |
| Current recommendation label | `52px` | `232px` | `120px` | `18px` |
| Current recommendation | `52px` | `258px` | `220px` | `33px` |
| Reasons label | `34px` | `322px` | `200px` | `22px` |
| Reasons scroll container | `28px` | `354px` | `334px` | `156px` |
| Minimum next step card | `34px` | `562px` | `322px` | `82px` |
| Minimum next step label | `52px` | `583px` | `160px` | `18px` |
| Minimum next step body | `52px` | `609px` | `280px` | `23px` |
| Button 1 | `38px` | `703px` | `96px` | `42px` |
| Button 2 | `146px` | `703px` | `96px` | `42px` |
| Button 3 | `254px` | `703px` | `96px` | `42px` |

#### Screen C

| Element | x | y | w | h |
|---|---:|---:|---:|---:|
| Primary card | `16px` | `78px` | `358px` | `604px` |
| Page label | `34px` | `104px` | `200px` | `18px` |
| Possible pattern title | `34px` | `134px` | `312px` | `68px` |
| Confidence sentence | `34px` | `214px` | `310px` | `40px` |
| Rationale label | `34px` | `296px` | `250px` | `22px` |
| Rationale scroll container | `28px` | `328px` | `334px` | `169px` |
| Status card | `34px` | `522px` | `322px` | `126px` |
| Status label | `52px` | `540px` | `120px` | `18px` |
| Status body | `52px` | `568px` | `260px` | `30px` |
| Status explanation | `52px` | `600px` | `278px` | `32px` |
| Button 1 | `35px` | `704px` | `96px` | `42px` |
| Button 2 | `143px` | `704px` | `120px` | `42px` |
| Button 3 | `275px` | `704px` | `72px` | `42px` |

## Screen A: 今日主问题首页

Figma frame: `A 今日主问题首页`

Purpose:

DragonMind shows one main issue for today, plus why it matters, evidence, and suggested actions.

### Content

| Area | Current Text | Data Mapping |
|---|---|---|
| Kicker | `今天最值得看的一件事` | Daily top issue label; computed from discovery feed/runtime importance |
| Main issue | `你可能正在被工具形态带偏产品判断。` | Top issue title; derived from selected node/insight |
| One-line judgment | `你现在真正纠结的不是 Notion、OpenClaw 或 Figma，而是 DragonMind 的入口会不会把它带偏成任务管理工具。` | Current agent interpretation; maps to `node_interpretation` or computed display model |
| Why this matters label | `我为什么提醒你` | Static section label |
| Why this matters | `如果入口设计错了，DragonMind 会变成另一个记录/待办工具，而不是个人数字参谋。` | Importance reason; computed from relation/evidence/task context |
| Evidence section label | `我看到的证据` | Static section label |
| Recommendation label | `我的建议` | Static section label |
| Recommendation | `先不要继续加页面。下一版只验证一个核心体验：打开后能不能直接指出今天最值得判断的问题。` | Agent suggestion; computed/display text, not a table |

### Evidence Scroll Container

Layer: `证据滚动容器`

The evidence area is intentionally a fixed-height scroll container. Evidence may exceed three items, and the page should not grow indefinitely.

Current evidence items:

| Evidence | Click Behavior | Possible Data Source |
|---|---|---|
| `你看到 Notion 时，第一反应是它像团队任务分配工具。` | Opens source modal | Related `node_message`, `evidence`, or source `node` |
| `你讨论 OpenClaw 时，主动区分了执行层和认知核心。` | Opens source modal | Related `node_message`, `evidence`, or source `node` |
| `你看到 Figma 原型后，觉得导航复杂、页面难以聚焦。` | Opens source modal | Related `node_message`, `evidence`, or source `node` |

Evidence item display model:

| Field | Meaning |
|---|---|
| `id` | UI key |
| `summary` | Evidence summary shown in list |
| `source_type` | `node`, `node_message`, `evidence`, or `relation` |
| `source_id` | Source object id |
| `source_title` | Source modal title |
| `source_excerpt` | Source modal body |

### Source Modal

Shown in this Figma state:

| Modal Element | Current Text |
|---|---|
| Label | `来源记录` |
| Title | `Notion 像任务分配工具` |
| Body | `这条来源来自你对 Notion 入口气质的判断：它更容易让人进入团队协作和任务管理心智。` |
| Source | `来源：Spark · Notion 主入口讨论` |
| Close button | `知道了` |

### Actions

| Button | Meaning | Implementation Mapping |
|---|---|---|
| `帮我判断` | Open lightweight judgment screen | Navigate to Screen B for current issue/node |
| `继续观察` | Keep tracking without acting | No schema change; may keep task/relation pending |
| `记为可能模式` | Open possible pattern screen | Navigate to Screen C for current issue/node |

## Screen B: 帮我判断展开页

Figma frame: `B 帮我判断展开页`

Purpose:

This is a lightweight advisor judgment page. It is not a complex Decision Room and does not introduce a Conversation table.

When the user discusses or expands analysis here, the implementation should append to the current node's `node_message` and update/create `node_interpretation` as needed.

### Content

| Area | Current Text | Data Mapping |
|---|---|---|
| Page label | `决策屋` | Friendly judgment mode label |
| Question | `要不要继续使用多页面导航？` | Current judgment question; derived from current issue/node |
| Current recommendation label | `当前建议` | Static label |
| Current recommendation | `不要。` | Agent recommendation; computed/display text |
| Reasons label | `理由` | Static label |
| Minimum next step label | `最小下一步` | Static label |
| Minimum next step | `改成单焦点首页 + 底部输入框。` | Suggested next action |

### Reasons Scroll Container

Layer: `证据滚动容器`

The reasons area is a fixed-height scroll container.

Current reason items:

| Reason | Data Mapping |
|---|---|
| `它让用户理解系统结构，而不是关注问题本身。` | Agent reasoning; can be persisted as `node_message` if accepted/discussed |
| `它把后台能力暴露成前台负担。` | Agent reasoning |
| `它削弱了个人参谋的单点提醒感。` | Agent reasoning |

### Accept Recommendation Modal

Shown in this Figma state:

| Modal Element | Current Text |
|---|---|
| Title | `已准备接受这条建议` |
| Status | `结果状态：将把“不要继续使用多页面导航”记入当前判断。` |
| Body | `确认后，DragonMind 会把这次选择写入当前线索，并保留后续复盘入口。点击取消则不接受建议。` |
| Cancel button | `取消` |
| Confirm button | `确认接受` |

Implementation rule:

| User Action | Expected Result |
|---|---|
| Tap `接受建议` | Show modal only |
| Tap `取消` | Close modal, do not accept suggestion |
| Tap `确认接受` | Append acceptance to `node_message`; optionally progress current node or create a review task if required by product flow |

### Actions

| Button | Meaning | Implementation Mapping |
|---|---|---|
| `接受建议` | User agrees with agent recommendation | Open accept modal first |
| `我不同意` | User pushes back | Append user message to current `node_message`; keep analysis open |
| `稍后复盘` | User defers judgment to review | Create or update `task` with `task_type = review` if needed |

## Screen C: 可能模式展开页

Figma frame: `C 可能模式展开页`

Purpose:

Shows a possible recurring cognitive pattern in human language. It should not be presented as a Pattern Candidate module.

### Content

| Area | Current Text | Data Mapping |
|---|---|---|
| Page label | `认知殿` | Friendly pattern tracking label |
| Possible pattern | `可能模式：你对工具默认心智很敏感。` | Computed possible pattern display; not a table |
| Confidence sentence | `出现3次，可信度：中。先继续观察，不急着沉淀为原则。` | Runtime display, computed from relation/repeated evidence count |
| Rationale label | `我为什么这么判断` | Static label |
| Status label | `状态` | Static label |
| Status | `继续观察，暂不沉淀。` | Display status; no new table |
| Status explanation | `当它再次影响产品入口判断时，再考虑升级为产品原则。` | Escalation condition |

### Rationale Scroll Container

Layer: `证据滚动容器`

The rationale area is a fixed-height scroll container.

Current rationale items:

| Rationale | Click Behavior | Possible Data Source |
|---|---|---|
| `Notion 被你识别为任务管理气质。` | Opens source modal | Related `node_message`, `evidence`, or source `node` |
| `OpenClaw 被你识别为执行层，不是大脑。` | Opens source modal | Related `node_message`, `evidence`, or source `node` |
| `当前 Figma 被你识别为过度模块化。` | Opens source modal | Related `node_message`, `evidence`, or source `node` |

### Source Modal

Shown in this Figma state:

| Modal Element | Current Text |
|---|---|
| Label | `来源记录` |
| Title | `OpenClaw 是执行层，不是大脑` |
| Body | `这条依据来自你对系统分层的判断：执行工具可以强，但不能替代 DragonMind 的认知核心。` |
| Source | `来源：Spark · OpenClaw 分层讨论` |
| Close button | `知道了` |

### Actions

| Button | Meaning | Implementation Mapping |
|---|---|---|
| `继续观察` | Keep possible pattern as unconfirmed | No new schema; keep display computed |
| `确认为产品原则` | Convert possible pattern into accepted learning/principle | In v0.1, represent via `node_interpretation` and/or append `node_message`; do not add Concept/Pattern table |
| `忽略` | Dismiss this possible pattern | Mark related `relation` as dismissed where applicable, or append dismissal message |

## Database Boundary

The following are not v0.1 database tables:

| Display Concept | Table? | Correct v0.1 Mapping |
|---|---:|---|
| `daily_brief` | No | Query/display model from discovery feed |
| `agent_recommendation` | No | Derived display text from `node_interpretation`, `relation`, `task`, `evidence` |
| `judgment` | No | Current node analysis; persisted through `node_message` / `node_interpretation` |
| `possible_pattern` | No | Computed from repeated relations/evidence; no new table in v0.1 |

Existing v0.1 tables remain:

| Table | Role |
|---|---|
| `node` | Core cognitive object |
| `node_message` | Append-only content and user/agent updates |
| `node_interpretation` | Agent's current interpretation of a node |
| `relation` | Derived, related, supporting, or contradicting links |
| `evidence` | Source material attached to node or relation |
| `task` | Follow-up/review/reminder workflow |

## Implementation Notes

| Requirement | Implementation Direction |
|---|---|
| Single main issue | Pick top runtime-importance item from discovery feed |
| Scrollable evidence | Fixed-height evidence/rationale container with internal scroll |
| Evidence click | Open source modal for the clicked item |
| Accept suggestion | Show modal first; only persist after confirm |
| Cancel suggestion | Close modal without persisting |
| Possible pattern confidence | Compute at query time; do not store score in DB |
| Bottom capture | `+` opens Spark capture page later; expanded capture page is deferred |
