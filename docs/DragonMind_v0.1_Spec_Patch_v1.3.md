# DragonMind v0.1 规格修正补丁 v1.3

状态：已采纳

目的：在进入实现前，吸收独立工程审计反馈，补齐最小工程约束。

适用文档：

* DragonMind_v0.1_Spec.md
* 04_DATABASE.md
* 05_WORKFLOW.md
* 06_AGENT_RULES.md
* 08_IMPLEMENTATION_PLAN.md

---

# 1. Task 状态机

## 问题

之前规格中定义 Task 生命周期为：

pending

↓

sleeping

↓

completed

但这个状态机不完整，容易造成实现歧义。

## 决策

Task 的 status 只允许以下三个值：

* pending
* sleeping
* completed

## 允许的状态流转

pending → completed

pending → sleeping

sleeping → pending

sleeping → completed

completed 在 v0.1 中是终态。

v0.1 不支持重新打开 completed task。

如果一个 completed task 后续再次变得相关，系统应创建一个新的 task，而不是重新打开旧 task。

---

# 2. Reminder Cadence

Reminder cadence 不是 Task 状态。

Reminder cadence 是调度策略，通过以下字段表达：

* remind_count
* last_remind_at
* next_remind_at

## 默认节奏

Task 创建时：

status = pending

remind_count = 0

next_remind_at = 当天 21:00

## 用户无响应时

第一次提醒后：

remind_count = 1

next_remind_at = 7 天后

第二次提醒后：

remind_count = 2

next_remind_at = 30 天后

第三次提醒后仍无响应：

status = sleeping

next_remind_at = null

## 用户行为

用户完成 task：

pending → completed

sleeping → completed

用户忽略 task：

不立即改变 status。

Reminder Engine 继续推进 cadence。

用户延后 task：

status 保持 pending。

更新 next_remind_at。

系统自动休眠 task：

pending → sleeping

---

# 3. Task Revival

Sleeping task 可以被重新激活。

## 触发条件

当以下情况提升某个 sleeping task 的相关性时，可以触发 revival：

* 新 Spark
* 新 Evidence
* 新 Relation
* 新 Discovery Result
* 相似问题重新出现

## 状态流转

sleeping → pending

重新激活时：

remind_count = 0

last_remind_at = null

next_remind_at = 下一次计划提醒时间

---

# 4. Evidence 归属模型

## 问题

之前规格中没有明确 Evidence 到底归属于什么对象。

## 决策

Evidence 是事实材料。

Evidence 不是 Node。

Evidence 不参与 Relation graph。

Evidence 必须挂载到一个 target 上。

## Evidence Target

Evidence 必须包含：

target_type

target_id

允许的 target_type：

* node
* relation

## Evidence Stance

Evidence 必须包含：

stance

允许的 stance：

* supports
* contradicts
* neutral

## Evidence 含义

如果 target_type = node：

Evidence 表示它支持、反驳或中性记录某个 Node。

如果 target_type = relation：

Evidence 表示它支持、反驳或中性记录某个 Relation。

## Evidence 最小字段

* id
* target_type
* target_id
* evidence_type
* stance
* content
* source
* source_url
* created_at

## Evidence 原则

Evidence 是事实材料。

Relation 是认知连接。

二者是不同系统。

Evidence 不替代 Relation。

Relation 不替代 Evidence。

---

# 5. Radius1 结果存储

Radius1 事实验证结果存储为 Evidence。

## Radius1 输出

Radius1 应产生：

* evidence item
* target_type
* target_id
* stance
* source
* summary
* verification_result

## Radius1 限制

Radius1 只做事实验证。

Radius1 不生成解释。

Radius1 不生成策略。

Radius1 不创建 Concept。

Radius1 不创建 Attention Pattern。

---

# 6. Relation 语义

## 问题

之前规格中没有定义 Relation 的方向性、状态、唯一性和来源。

## 决策

Relation 是唯一的认知关系系统。

Relation 用于连接 Node。

Evidence 不参与 Relation graph。

## Relation Types

允许的 relation_type：

* derived_from
* related
* supports
* contradicts

## 方向规则

derived_from 是有向关系。

示例：

Reasoning derived_from Spark

存储为：

source_node_id = reasoning_node_id

target_node_id = spark_node_id

relation_type = derived_from

supports 是有向关系。

contradicts 是有向关系。

related 在逻辑上是无向关系，但数据库中按规范顺序存储。

对于 related：

source_node_id 必须是字典序较小的 id。

target_node_id 必须是字典序较大的 id。

这样可以避免出现重复的反向 related relation。

## Relation Status

Relation 必须有 status。

允许的 status：

* suggested
* confirmed
* dismissed

Discovery 生成的 Relation 默认为：

status = suggested

用户确认后：

status = confirmed

用户拒绝后：

status = dismissed

dismissed relation 不删除，保留为历史记录。

## Relation Source

Relation 必须有 created_by。

允许的 created_by：

* user
* agent
* system

## Relation Reason

Relation 必须有 relation_reason。

该字段解释为什么这个关系存在。

禁止创建无法解释的长期 Relation。

## Relation 去重规则

不允许重复 active relation。

唯一性 key：

source_node_id

target_node_id

relation_type

status in suggested or confirmed

dismissed relation 保留历史，但如果后续出现新的 reason，可以重新创建新的 relation。

---

# 7. Node 与 node_message 的边界

## 问题

之前规格中没有明确 Node 和 node_message 分别存什么。

## 决策

Node 是稳定对象壳。

node_message 是 append-only 内容流。

## Node 存储内容

Node 存储稳定元信息：

* id
* node_type
* lifecycle_status
* title
* created_at
* updated_at
* archived_at

Node 不存储完整的持续演化内容。

## node_message 存储内容

node_message 存储内容事件：

* 用户原始输入
* Agent 回复
* reasoning draft
* decision prep draft
* final decision text
* correction
* edit
* clarification

## Append-only 规则

node_message 在 v0.1 中默认 append-only。

已有 message 不覆盖。

如果用户编辑内容，系统追加一条新 message，message_type = correction 或 edit。

## 当前展示规则

Node 详情页：

按 created_at 升序展示 messages。

Node 卡片摘要：

使用 node.title 加最新相关 node_message。

完整认知轨迹必须可恢复。

---

# 8. Decision 模型

## 问题

之前规格中把 Decision 列为 Node Type，但 Archive 中又单独提到 Decision，可能让实现者误以为需要独立 decision 表。

## 决策

Decision 是一种 Node Type。

v0.1 不创建独立 decision 表。

Decision 表示为：

node.node_type = decision

Decision 内容存储在 node_message 中。

Decision 通过 Relation 连接到 Decision Prep：

decision derived_from decision_prep

## v0.1 不创建 decision 表

v0.1 不创建独立 decision 表。

如果未来需要结构化决策字段，可在 v0.2+ 再扩展。

---

# 9. v0.1 Discovery 范围

## 问题

之前规格中把太多 Discovery 能力放在同一优先级。

## 决策

Discovery 能力分级实现。

## v0.1 Must-have

* related Spark discovery
* duplicate / recurring Spark discovery
* Spark Task creation
* Discovery Task creation
* Task Revival

## v0.1 Basic

* simple contradiction detection
* simple anomaly detection

## v0.1 Optional

* Radius1 fact verification
* historical counterexample discovery

Optional 能力不阻塞 MVP 完成。

---

# 10. Runtime Importance 排序

## 原则

Importance 不持久化。

Runtime Importance 在查询时实时计算。

## 允许使用的输入

Runtime Importance 可以使用：

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

## 规则

不要把 importance score 存入数据库。

只存储计算 importance 所需的事实输入。

---

# 11. Input Classifier 持久化规则

## Spark

Spark 创建：

* Spark Node
* node_message
* node_interpretation
* Spark Task

## Chat

Chat 默认不创建 Node。

Chat 是运行时交互。

如果用户明确说“保存这个”，系统再创建 Spark 或其他合适 Node。

## Command

Command 默认不创建 Node。

Command 执行系统动作。

Command 可以更新：

* Task status
* Node lifecycle_status
* Relation status
* archived_at
* next_remind_at

只有当 command 明确需要创建新的认知对象时，Command 才创建 Node。

---

# 12. Archive 语义

Archive 是状态。

Archive 不移动、不复制、不删除数据。

## Node Archive

Node archive 表达为：

lifecycle_status = archived

archived_at = timestamp

## Task Archive

Task 如有需要可以包含 archived_at。

Archived task 不出现在 active reminders 中。

## Relation 与 Evidence

Relation 与 Evidence 在 v0.1 中不单独归档。

它们仍然挂载在原 target 上。

## Archived Objects

已归档对象：

* 默认不出现在 Workspace
* 默认不生成提醒
* 仍可搜索
* 可用于历史反例
* 可被未来 Discovery 引用

---

# 13. node_interpretation 版本规则

一个 Node 可以有多个 node_interpretation records。

每个 interpretation 包含：

* extraction_version
* created_at

默认读取行为：

读取 created_at 最新的一条 interpretation。

历史 interpretation 保留。

---

# 14. 阶段推进规则

默认认知推进：

Spark

↓

Reasoning

↓

Decision Prep

↓

Decision

## 允许

Spark → Reasoning

Reasoning → Decision Prep

Decision Prep → Decision

多个 Spark → 一个 Reasoning

一个 Spark → 多个 Reasoning

多个 Reasoning → 一个 Decision Prep

一个 Decision Prep → 多个 Decision，仅当它们代表不同时间点的不同用户选择。

## 默认不允许

Decision → Decision Prep

Decision → Reasoning

Reasoning → Spark

这些情况应该创建新的 Node 和新的 Relation，而不是修改历史。

---

# 15. 最小 API 资源边界

v0.1 应暴露轻量资源：

* nodes
* messages
* relations
* evidence
* tasks
* discovery-feed
* commands

这不是完整 OpenAPI 要求。

这是实现规划的资源边界。

## 必要动作

Create Spark

Append Message

Create Relation

Update Relation Status

Create Evidence

Create Task

Update Task Status

Get Discovery Feed

Archive Node

Progress Node Stage

---

# 16. 更新后的实现就绪状态

应用 Patch v1.3 后，DragonMind v0.1 可以进入 implementation planning。

在 consolidated Spec 合并本 patch 前，不应开始完整编码。
