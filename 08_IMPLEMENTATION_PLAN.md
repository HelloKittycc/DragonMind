# DragonMind v0.1 Implementation Plan

Source of Truth: `docs/DragonMind_v0.1_Spec.md`

Scope: v0.1 engineering implementation plan only. This plan does not change product vision, add new features, or introduce modules listed as v0.1 non-goals.

Technical Stack:

* Frontend: Next.js App Router
* Backend: FastAPI
* Database: SQLite
* Deployment posture: local-first, no cloud for v0.1

---

# 1. 推荐项目目录结构

以下目录结构按 v0.1 的 Data Layer 和 Discovery Layer 拆分，保持资源边界清晰。前端只使用 Next.js App Router。

```text
DragonMind/
  docs/
    DragonMind_v0.1_Spec.md
    DragonMind_v0.1_Architecture_Audit.md
  08_IMPLEMENTATION_PLAN.md
  apps/
    web/
      src/
        app/
          page.tsx
          discovery-feed/
            page.tsx
          workspace/
            page.tsx
          nodes/
            [id]/
              page.tsx
        components/
          input/
          nodes/
          tasks/
          relations/
          evidence/
          layout/
        api-client/
        styles/
    api/
      src/
        main/
        config/
        db/
          migrations/
          schema/
        modules/
          nodes/
          messages/
          interpretations/
          relations/
          evidence/
          tasks/
          discovery/
          commands/
        services/
          input-classifier/
          reminder-engine/
        shared/
          errors/
          validation/
          time/
        tests/
  packages/
    shared/
      src/
        types/
        constants/
        validators/
```

## 目录说明

* `apps/api/src/modules/nodes`：Node CRUD、stage progression、archive。
* `apps/api/src/modules/messages`：append-only node_message 写入和读取。
* `apps/api/src/modules/interpretations`：entities / keywords extraction result 写入和最新版本读取。
* `apps/api/src/modules/relations`：Relation 创建、状态更新、去重和 related 规范排序。
* `apps/api/src/modules/evidence`：Evidence 创建和 target 查询。
* `apps/api/src/modules/tasks`：Task 创建、状态更新、提醒字段更新。
* `apps/api/src/modules/discovery`：related / duplicate / basic contradiction / basic anomaly / feed query。
* `apps/api/src/modules/commands`：Command 输入对应的系统动作。
* `apps/api/src/services/input-classifier`：Spark / Chat / Command 分类。
* `apps/api/src/services/reminder-engine`：pending / sleeping / completed 与 reminder cadence。
* `apps/web/src/app/page.tsx`：Agent观察日报首页。
* `apps/web/src/app/discovery-feed/page.tsx`：Agent观察日报显式路径。
* `apps/web/src/app/workspace/page.tsx`：Inbox / Active / Decision / All filters。
* `apps/web/src/app/nodes/[id]/page.tsx`：Node messages、relations、evidence、tasks。

---

# 2. 数据库 Schema / Migration 顺序

Migration 必须先落 Data Layer，再落 Discovery / Reminder 所需索引。

SQLite implementation notes:

* 使用 SQLite 作为 v0.1 本地优先数据库。
* Relation active 去重使用 SQLite partial unique index 实现。
* Evidence 的 `target_type` / `target_id` 是多态目标，SQLite 不直接建立跨表 foreign key，由应用层校验目标存在性。
* 所有时间字段统一存储为 ISO-8601 字符串或 Unix timestamp，应用层保持一致即可。

## 001_create_node

创建 `node` 表。

字段：

* `id`
* `node_type`
* `title`
* `lifecycle_status`
* `created_at`
* `updated_at`
* `archived_at`

约束：

* `node_type` in `spark`, `reasoning`, `decision_prep`, `decision`
* `lifecycle_status` in `open`, `closed`, `archived`
* `archived_at` nullable

索引：

* `node_type`
* `lifecycle_status`
* `created_at`
* `archived_at`

## 002_create_node_message

创建 `node_message` 表。

字段：

* `id`
* `node_id`
* `role`
* `content`
* `message_type`
* `created_at`

约束：

* `node_id` references `node(id)`
* `role` in `user`, `agent`, `system`
* `message_type` in `original`, `reply`, `reasoning`, `decision_prep`, `decision`, `correction`, `edit`, `command_result`

索引：

* `node_id`
* `(node_id, created_at)`

规则：

* v0.1 不提供 update message 接口。
* 用户编辑或修正时追加新的 `node_message`。

## 003_create_node_interpretation

创建 `node_interpretation` 表。

字段：

* `id`
* `node_id`
* `entities_json`
* `keywords_json`
* `extraction_version`
* `created_at`

约束：

* `node_id` references `node(id)`

索引：

* `node_id`
* `(node_id, created_at)`
* `extraction_version`

规则：

* 一个 Node 可以有多条 records。
* 默认读取最新版本。
* 不存储 `confidence`、`importance`、`summary`、`concept`、`insight`、`attention_pattern`。

## 004_create_relation

创建 `relation` 表。

字段：

* `id`
* `source_node_id`
* `target_node_id`
* `relation_type`
* `relation_reason`
* `status`
* `created_by`
* `created_at`

约束：

* `source_node_id` references `node(id)`
* `target_node_id` references `node(id)`
* `relation_type` in `derived_from`, `related`, `supports`, `contradicts`
* `status` in `suggested`, `confirmed`, `dismissed`
* `created_by` in `user`, `agent`, `system`
* `source_node_id != target_node_id`

索引：

* `source_node_id`
* `target_node_id`
* `relation_type`
* `status`
* `(source_node_id, target_node_id, relation_type)`

去重规则：

* 不允许重复 active relations。
* active relation 指 `status` 为 `suggested` 或 `confirmed`。
* `dismissed` relations 保留为历史，不删除。
* SQLite 使用 partial unique index 约束 active relations：

```sql
CREATE UNIQUE INDEX idx_relation_active_unique
ON relation (source_node_id, target_node_id, relation_type)
WHERE status IN ('suggested', 'confirmed');
```

实现要求：

* `related` 写入前必须按字典序规范化 `source_node_id` 和 `target_node_id`。
* `derived_from` / `supports` / `contradicts` 保持调用方给定方向。

## 005_create_evidence

创建 `evidence` 表。

字段：

* `id`
* `target_type`
* `target_id`
* `evidence_type`
* `stance`
* `content`
* `source`
* `source_url`
* `created_at`

约束：

* `target_type` in `node`, `relation`
* `stance` in `supports`, `contradicts`, `neutral`
* `evidence_type` in `fact`, `data`, `document`, `experience`, `radius1_result`
* `target_type` / `target_id` 多态目标由应用层校验，SQLite migration 不建立跨表 foreign key

索引：

* `(target_type, target_id)`
* `evidence_type`
* `stance`
* `created_at`

规则：

* Evidence 不参与 Relation graph。
* Evidence 不替代 Relation。
* Relation 不替代 Evidence。

## 006_create_task

创建 `task` 表。

字段：

* `id`
* `node_id`
* `task_type`
* `source_type`
* `content`
* `status`
* `remind_count`
* `last_remind_at`
* `next_remind_at`
* `archived_at`
* `created_at`
* `updated_at`

约束：

* `node_id` references `node(id)`
* `task_type` in `spark_follow_up`, `discovery_expand`, `verify`, `review`, `manual`
* `source_type` in `spark`, `discovery`, `user`, `system`
* `status` in `pending`, `sleeping`, `completed`

索引：

* `node_id`
* `status`
* `next_remind_at`
* `task_type`
* `source_type`
* `archived_at`

状态规则：

* 允许 `pending -> completed`
* 允许 `pending -> sleeping`
* 允许 `sleeping -> pending`
* 允许 `sleeping -> completed`
* `completed` 在 v0.1 中是终态

## 007_add_discovery_query_indexes

补充 Discovery Feed 和 Workspace 查询索引。

建议索引：

* `node(lifecycle_status, node_type, created_at)`
* `task(status, next_remind_at, updated_at)`
* `relation(status, relation_type, created_at)`
* `node_message(node_id, created_at)`
* `evidence(target_type, target_id, created_at)`

---

# 3. 后端 API 资源与核心接口

API 资源边界严格对应 Spec：

* `nodes`
* `messages`
* `relations`
* `evidence`
* `tasks`
* `discovery-feed`
* `commands`

## nodes

### `POST /nodes/spark`

Create Spark。

行为：

1. 分类结果为 Spark 后创建 `node(node_type = spark)`。
2. 追加 `node_message(message_type = original, role = user)`。
3. 创建 `node_interpretation`。
4. 创建 `task(task_type = spark_follow_up, source_type = spark)`。
5. 运行 minimal Discovery。
6. 返回 Spark Node 和相关 Task / Discovery 结果。

### `POST /nodes/:id/progress`

Progress Node Stage。

行为：

* `spark -> reasoning`
* `reasoning -> decision_prep`
* `decision_prep -> decision`

写入：

* 新 Node
* 新 node_message
* `relation_type = derived_from`

不允许：

* `decision -> decision_prep`
* `decision -> reasoning`
* `reasoning -> spark`

### `PATCH /nodes/:id/archive`

Archive Node。

行为：

* `lifecycle_status = archived`
* `archived_at = timestamp`

注意：

* 不移动、不复制、不删除数据。
* 已归档对象默认不出现在 Workspace。
* 已归档对象默认不生成提醒。

### `GET /nodes/:id`

返回 Node 详情。

包含：

* Node metadata
* messages created_at 升序
* relations
* evidence
* related tasks

## messages

### `POST /nodes/:id/messages`

Append Message。

行为：

* 追加 `node_message`
* 不覆盖已有 message

适用：

* reply
* reasoning
* decision_prep
* decision
* correction
* edit
* command_result

## relations

### `POST /relations`

Create Relation。

行为：

* 创建 `derived_from` / `related` / `supports` / `contradicts`
* Discovery 创建时默认 `status = suggested`
* 用户创建时可直接 `status = confirmed`
* 执行 active relation 去重
* `related` 自动规范 source / target 顺序

### `PATCH /relations/:id/status`

Update Relation Status。

允许：

* `suggested -> confirmed`
* `suggested -> dismissed`

规则：

* dismissed 不删除。

## evidence

### `POST /evidence`

Create Evidence。

行为：

* 挂载到 `target_type = node` 或 `relation`
* 写入 stance 和 evidence_type

### `GET /evidence?target_type=&target_id=`

查询某个 Node 或 Relation 的 Evidence。

## tasks

### `POST /tasks`

Create Task。

适用：

* manual
* verify
* review
* discovery_expand
* spark_follow_up

### `PATCH /tasks/:id/status`

Update Task Status。

允许：

* `pending -> completed`
* `pending -> sleeping`
* `sleeping -> pending`
* `sleeping -> completed`

### `PATCH /tasks/:id/reminder`

更新 reminder cadence 字段。

适用：

* 延后 task
* Reminder Engine 推进 `remind_count`
* 更新 `last_remind_at`
* 更新 `next_remind_at`

### `GET /tasks`

支持筛选：

* `status`
* `task_type`
* `source_type`
* `node_id`

## discovery-feed

### `GET /discovery-feed`

Get Discovery Feed。

返回 Agent观察日报 items。

包含来源：

* related Sparks
* repeated Sparks
* contradictions
* anomalies
* historical counterexamples
* Task Revival
* Radius1 verification results
* pending Spark follow-ups
* Discovery Tasks

排序：

* 按 Runtime Importance 查询时实时计算。
* 不存储 importance score。

Runtime Importance 输入：

* pending task existence
* number of related nodes
* relation type
* contradiction existence
* recurrence count
* revived task flag
* recentness
* unhandled duration
* node_type
* evidence existence
* Radius1 result existence

## commands

### `POST /commands`

Command 执行入口。

允许更新：

* Task status
* Node lifecycle_status
* Relation status
* archived_at
* next_remind_at

规则：

* Command 默认不创建 Node。
* 只有当 command 明确需要创建新的认知对象时才创建 Node。

---

# 4. 前端页面与主要组件

# 4.1 Discovery Feed：首页 / Agent观察日报

路径建议：

* `/`
* `/discovery-feed`

主要组件：

* `DiscoveryFeedPage`
* `FeedItemList`
* `FeedItemCard`
* `RuntimeImportanceSortLabel`
* `RelatedSparkItem`
* `RepeatedSparkItem`
* `ContradictionItem`
* `AnomalyItem`
* `TaskRevivalItem`
* `Radius1ResultItem`
* `PendingSparkFollowUpItem`
* `DiscoveryTaskItem`

用户操作：

* 打开相关 Node
* 确认 / dismiss suggested relation
* 完成 / 延后 task
* 从 Spark 推进到 Reasoning

验收重点：

* Feed 可以展示 pending Spark follow-ups。
* Feed 可以展示 related / repeated Sparks。
* Feed 排序不依赖持久化 importance score。

# 4.2 Workspace

路径建议：

* `/workspace`

Filters：

* Inbox
* Active
* Decision
* All

主要组件：

* `WorkspacePage`
* `WorkspaceFilters`
* `NodeList`
* `NodeCard`
* `TaskBadge`
* `LifecycleStatusBadge`

Filter 规则：

* Inbox：展示 pending tasks 及其相关 Nodes。
* Active：展示 open Reasoning 和 Decision Prep Nodes，也展示有 pending tasks 的 Nodes。
* Decision：展示 Decision Prep 和 Decision Nodes。
* All：展示所有非 archived Nodes。

# 4.3 Node Detail

路径建议：

* `/nodes/:id`

主要组件：

* `NodeDetailPage`
* `NodeHeader`
* `MessageTimeline`
* `AppendMessageForm`
* `StageProgressionActions`
* `RelationPanel`
* `EvidencePanel`
* `TaskPanel`
* `ArchiveAction`

规则：

* Messages 按 `created_at` 升序展示。
* 编辑或修正通过追加 message 实现。
* Stage progression 创建新 Node 和 `derived_from` relation。

# 4.4 Input Capture

位置：

* Discovery Feed 顶部
* Workspace 顶部

主要组件：

* `InputCapture`
* `InputClassifierResult`
* `SparkCreateResult`

规则：

* 模糊输入默认 Spark。
* Spark 创建后返回新 Node、Spark Task、minimal Discovery 结果。
* Chat 默认不创建 Node。
* Command 默认不创建 Node。

# 4.5 Task Controls

主要组件：

* `TaskList`
* `TaskCard`
* `TaskStatusActions`
* `ReminderControls`

用户操作：

* complete
* delay
* sleep

规则：

* completed 是 v0.1 终态。
* sleeping 可通过 revival 回到 pending。

---

# 5. 核心工作流实现顺序

## Workflow 1: Spark Capture

顺序：

1. 用户输入。
2. Input Classifier 判断 Spark / Chat / Command。
3. 模糊输入默认 Spark。
4. 创建 Spark Node。
5. 追加 original node_message。
6. 创建 node_interpretation。
7. 创建 spark_follow_up Task。
8. 运行 minimal Discovery。
9. 返回结果。

验收标准：

* 每个 Spark 都有 Node。
* 每个 Spark 都有 original message。
* 每个 Spark 都有 interpretation。
* 每个 Spark 都有 spark_follow_up task。

## Workflow 2: Stage Progression

顺序：

1. 在 Node Detail 选择推进。
2. 创建下一阶段 Node。
3. 追加对应 message。
4. 创建 `derived_from` relation。
5. 返回新 Node。

允许：

* Spark -> Reasoning
* Reasoning -> Decision Prep
* Decision Prep -> Decision

验收标准：

* 原 Node 不被覆盖。
* 新 Node 类型正确。
* Relation 方向正确。
* Decision 不写入独立表。

## Workflow 3: Relation Management

顺序：

1. Discovery 或用户创建 Relation。
2. 对 `related` 执行 source / target 规范排序。
3. 执行 active relation 去重。
4. Discovery 创建的 Relation 默认为 suggested。
5. 用户确认或 dismiss。

验收标准：

* 不出现重复 active relation。
* dismissed relation 保留。
* Relation status 更新可追踪。

## Workflow 4: Task Reminder Engine

顺序：

1. Task 创建时 `pending`、`remind_count = 0`、`next_remind_at = 当天 21:00`。
2. 第一次提醒后设置 7 天后提醒。
3. 第二次提醒后设置 30 天后提醒。
4. 第三次提醒仍无响应则进入 sleeping。
5. 用户可完成或延后。

默认时区：

* Reminder Engine v0.1 默认使用 `Asia/Shanghai` timezone。
* “当天 21:00”、7 天后、30 天后均按 `Asia/Shanghai` timezone 计算。

验收标准：

* 状态转移只允许 Spec 中定义的路径。
* Reminder cadence 不被当作状态。
* completed task 不重新打开。

## Workflow 5: Task Revival

顺序：

1. New Spark / New Evidence / New Relation / New Discovery Result / Similar issue reappears 触发检查。
2. 找到相关 sleeping task。
3. 执行 `sleeping -> pending`。
4. 重置 reminder 字段。

验收标准：

* sleeping task 可以恢复 pending。
* remind_count 重置为 0。
* last_remind_at 重置为 null。
* next_remind_at 设置为下一次计划提醒时间。

## Workflow 6: Discovery Feed

顺序：

1. 查询 pending Spark follow-ups。
2. 查询 Discovery Tasks。
3. 查询 related / repeated Sparks。
4. 查询 basic contradiction / anomaly。
5. 查询 optional Radius1 / historical counterexample 结果，如果已实现。
6. 基于 Runtime Importance inputs 计算排序。
7. 返回 Feed items。

验收标准：

* Agent观察日报可作为首页使用。
* Importance score 不入库。
* Feed item 可跳转到相关 Node / Task / Relation。

## Workflow 7: Archive

顺序：

1. 用户归档 Node。
2. 设置 `lifecycle_status = archived`。
3. 设置 `archived_at`。
4. Workspace 默认隐藏。
5. Reminder 默认不为 archived Node 生成新提醒。

验收标准：

* Archive 不移动、不复制、不删除数据。
* Archived Node 仍可搜索。
* Relation 和 Evidence 继续挂载到原 target。

---

# 6. Day 1 / Day 2 / Day 3 开发计划

# Day 1: Data Layer + Spark Capture

目标：

* 完成核心数据库表。
* 完成 Spark 创建闭环。
* 完成基础 Node Detail 读取。

任务：

1. 初始化项目骨架。
2. 实现 migrations 001-006。
3. 实现 shared constants / validators。
4. 实现 `POST /nodes/spark`。
5. 实现 `GET /nodes/:id`。
6. 实现 `POST /nodes/:id/messages`。
7. 实现 spark_follow_up task 自动创建。
8. 实现最小 node_interpretation 创建。
9. 实现前端 Input Capture。
10. 实现 Node Detail 的 message timeline。

Day 1 验收标准：

* 可以创建 Spark。
* Spark 创建后自动生成 Node、original message、interpretation、spark_follow_up task。
* Node Detail 能按时间展示 messages。
* 不存在 message 覆盖更新。

# Day 2: Relations + Stage Progression + Tasks

目标：

* 完成阶段推进。
* 完成 Relation 管理。
* 完成 Task 状态机和 Workspace。

任务：

1. 实现 `POST /nodes/:id/progress`。
2. 实现 `POST /relations`。
3. 实现 `PATCH /relations/:id/status`。
4. 实现 related source / target 规范排序。
5. 实现 active relation 去重。
6. 实现 `POST /tasks`。
7. 实现 `PATCH /tasks/:id/status`。
8. 实现 `PATCH /tasks/:id/reminder`。
9. 实现 Workspace filters：Inbox / Active / Decision / All。
10. 实现 Task controls：complete / delay / sleep。

Day 2 验收标准：

* Spark 可以推进为 Reasoning。
* Reasoning 可以推进为 Decision Prep。
* Decision Prep 可以推进为 Decision。
* 每次推进都创建新 Node 和 `derived_from` relation。
* 原 Node 不被覆盖。
* Task 状态转移符合 Spec。
* Workspace filters 返回正确对象集合。

# Day 3: Discovery Feed + Reminder + MVP Hardening

目标：

* 完成 v0.1 must-have Discovery。
* 完成 Agent观察日报首页。
* 完成 Reminder Engine 和 Archive。

任务：

1. 实现 minimal Discovery：related Spark discovery。
2. 实现 duplicate / recurring Spark discovery。
3. 实现 Discovery Task creation。
4. 实现 Task Revival。
5. 实现 `GET /discovery-feed`。
6. 实现 Runtime Importance 查询时排序。
7. 实现 Reminder Engine cadence 推进。
8. 实现 `PATCH /nodes/:id/archive`。
9. 实现 Discovery Feed 前端。
10. 完成端到端验收测试。

Day 3 验收标准：

* Agent观察日报可以展示 pending Spark follow-ups。
* Agent观察日报可以展示 related / repeated Sparks。
* Discovery 可以创建 Discovery Task。
* Sleeping Task 可被 Revival 恢复为 pending。
* Reminder cadence 正确推进到 sleeping。
* Archive 不删除历史且 Workspace 默认隐藏 archived Nodes。

---

# 7. 每个阶段的验收标准

# Phase 1: Data Layer

验收标准：

* 六张核心表存在：`node`、`node_message`、`node_interpretation`、`relation`、`evidence`、`task`。
* Decision 通过 `node.node_type = decision` 表示。
* 不存在独立 decision 表。
* Node 不存储完整持续演化内容。
* node_message append-only。
* node_interpretation 不存储 forbidden fields。
* Relation 是唯一认知关系系统。
* Evidence 不参与 Relation graph。

# Phase 2: Spark and Message Workflow

验收标准：

* 模糊输入默认 Spark。
* Spark 创建 Node、message、interpretation、task。
* Chat 默认不创建 Node。
* Command 默认不创建 Node。
* 用户明确保存 Chat 内容时才创建合适 Node。

# Phase 3: Stage Progression

验收标准：

* 支持 Spark -> Reasoning。
* 支持 Reasoning -> Decision Prep。
* 支持 Decision Prep -> Decision。
* 支持多 Spark -> 一个 Reasoning。
* 支持一个 Spark -> 多个 Reasoning。
* 支持多个 Reasoning -> 一个 Decision Prep。
* 支持一个 Decision Prep -> 多个 Decision，仅当它们代表不同时间点的不同用户选择。
* 默认不允许反向推进。

# Phase 4: Relation and Evidence

验收标准：

* 支持 `derived_from`、`related`、`supports`、`contradicts`。
* Discovery relations 默认为 suggested。
* 用户可以 confirmed / dismissed。
* dismissed relations 不删除。
* Evidence 可挂载到 Node 或 Relation。
* Evidence stance 可为 supports / contradicts / neutral。

# Phase 5: Task and Reminder

验收标准：

* 支持 pending / sleeping / completed。
* completed 为终态。
* 无响应 cadence 正确推进：当天 -> 7 天 -> 30 天 -> sleeping。
* 用户完成 task 后进入 completed。
* 用户延后 task 时保持 pending 并更新 next_remind_at。
* 用户忽略 task 时不立即改变 status。

# Phase 6: Discovery Layer

验收标准：

* 实现 related Spark discovery。
* 实现 duplicate / recurring Spark discovery。
* 实现 Spark Task creation。
* 实现 Discovery Task creation。
* 实现 Task Revival。
* Basic contradiction / anomaly 可以作为基础版本实现。
* Radius1 和 historical counterexample 不阻塞 MVP。

# Phase 7: Frontend MVP

验收标准：

* Discovery Feed 是首页。
* 首页正式名称为 Agent观察日报。
* Workspace 不是首页。
* Workspace 支持 Inbox / Active / Decision / All。
* Node Detail 展示 messages、relations、evidence、tasks。
* Archive 后对象默认不出现在 Workspace。

# Phase 8: MVP End-to-End

验收标准：

* 用户可以快速记录 Sparks。
* 每个 Spark 都创建可检索 Node。
* 每个 Spark 都创建 Spark Task。
* Discovery 可以发现基础 related 或 repeated Sparks。
* Discovery Feed 可以展示 Agent观察日报。
* 用户可以推进 Spark -> Reasoning -> Decision Prep -> Decision。
* Task Reminder Engine 支持 pending / sleeping / completed。
* Archive 不删除历史。

---

# 8. v0.1 Must-have 与 Optional

# v0.1 Must-have

以下功能必须完成，否则 v0.1 MVP 不成立：

## Data Layer

* `node`
* `node_message`
* `node_interpretation`
* `relation`
* `evidence`
* `task`
* Node append-only stage model
* node_message append-only
* Decision as Node Type
* Archive as status

## Input and Spark

* Input Classifier 支持 Spark / Chat / Command。
* 模糊输入默认 Spark。
* Spark 创建 Node、message、interpretation、spark_follow_up Task。
* Chat 默认不创建 Node。
* Command 默认不创建 Node。

## Stage Progression

* Spark -> Reasoning
* Reasoning -> Decision Prep
* Decision Prep -> Decision
* 通过 `derived_from` relation 连接。
* 不覆盖历史 Node。

## Relation

* `derived_from`
* `related`
* `supports`
* `contradicts`
* `suggested`
* `confirmed`
* `dismissed`
* active relation 去重

## Task and Reminder

* spark_follow_up Task
* discovery_expand Task
* pending / sleeping / completed
* Reminder cadence
* Task Revival

## Discovery

* related Spark discovery
* duplicate / recurring Spark discovery
* Spark Task creation
* Discovery Task creation
* Task Revival

## Frontend

* Discovery Feed / Agent观察日报
* Workspace filters：Inbox / Active / Decision / All
* Node Detail
* Input Capture
* Task Controls

# v0.1 Basic

以下功能建议实现，但可以用最小版本完成：

* simple contradiction detection
* simple anomaly detection

Basic 的验收口径：

* 可以基于明确关键词、entities 或 relation 类型做简单判断。
* 不需要复杂自主推理。
* 不创建 Concept、Insight 或 Attention Pattern。

# v0.1 Optional，不应阻塞 MVP

以下功能可以排在 MVP 之后，不应阻塞 v0.1 完成：

* Radius1 fact verification
* historical counterexample discovery

如果实现 Radius1：

* 只在 Spark 包含清晰可验证实体时自动运行。
* 结果存储为 Evidence。
* 不生成解释、策略、Concept 或 Attention Pattern。

以下明确不是 v0.1：

* Concept generation
* Insight generation
* Attention Pattern learning
* Outcome Review loop
* Multi-user support
* Cloud sync
* Vector database
* Full autonomous agent behavior
* Full long-term memory engine
* Conversation management system
* Project management system

---

# 9. MVP 完成定义

v0.1 MVP 可以视为完成，当且仅当：

1. 用户可以快速记录 Sparks。
2. 每个 Spark 都创建可检索 Node。
3. 每个 Spark 都创建 Spark Task。
4. Discovery 可以发现基础 related 或 repeated Sparks。
5. Discovery Feed 可以展示 Agent观察日报。
6. 用户可以推进 Spark -> Reasoning -> Decision Prep -> Decision。
7. Task Reminder Engine 可支持 pending / sleeping / completed。
8. Archive 不删除历史。
9. 连续使用两周后，核心数据库结构不需要重做。
