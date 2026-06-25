# DragonMind v0.1 规格说明书

版本：0.1

状态：Implementation Spec

唯一真相源：本文档取代此前所有 PRD、架构笔记、工作流笔记和 patch 文档。

---

# 1. 愿景

DragonMind 不是聊天机器人。

DragonMind 是一个个人认知操作系统。

它的目标是帮助用户记录、组织、验证、连接、回看并进化个人认知资产。

DragonMind 不替用户做最终决策。

DragonMind 帮助用户：

* 捕捉想法
* 发现关系
* 检查事实
* 暴露风险
* 提醒被忽略的问题
* 准备推理材料
* 挑战薄弱假设

最终决策权始终属于用户。

---

# 2. 核心原则

## 2.1 Record First

先记录。

后分析。

系统应尽量避免丢失原始认知材料。

## 2.2 Fact First

事实可以存储。

运行时判断不作为永久事实存储。

## 2.3 Explainable Only

长期能力必须可解释。

如果一个 pattern 无法解释，就不能被提升为长期记忆或长期能力。

## 2.4 User Final Authority

DragonMind 可以不同意用户。

DragonMind 可以挑战用户。

DragonMind 可以要求证据。

但最终决策始终属于用户。

## 2.5 Graph First

DragonMind 采用 graph-first 数据模型。

DragonMind 不采用 tree-first 的父子结构模型。

v0.1 中没有 parent_node_id。

所有认知关系都通过 Relation 表达。

---

# 3. 架构层级

DragonMind 有四个概念层：

Data Layer

Discovery Layer

Capability Layer

Meta Layer

v0.1 只实现：

* Data Layer
* Discovery Layer

Capability Layer 和 Meta Layer 属于未来版本。

---

# 4. 核心认知对象

v0.1 Node Types：

* spark
* reasoning
* decision_prep
* decision

未来 Node Types：

* outcome
* review
* concept
* insight

Attention Pattern 不是 Node。

Attention Pattern 属于未来的 Capability Layer。

---

# 5. Node 规则

Node 是稳定对象壳。

Node 不会被覆盖成另一种类型。

Spark 不会变成 Reasoning。

Reasoning 不会变成 Decision Prep。

每个认知阶段都会创建新的 Node。

正确推进方式：

Spark

↓

Reasoning

↓

Decision Prep

↓

Decision

每一步通过 Relation 连接。

---

# 6. 阶段推进

默认推进路径：

Spark → Reasoning

Reasoning → Decision Prep

Decision Prep → Decision

允许的多对多模式：

多个 Spark → 一个 Reasoning

一个 Spark → 多个 Reasoning

多个 Reasoning → 一个 Decision Prep

一个 Decision Prep → 多个 Decision，仅当它们代表不同时间点的不同用户选择。

默认不允许：

Decision → Decision Prep

Decision → Reasoning

Reasoning → Spark

如果需要回看或重新讨论之前阶段，应创建新的 Node，并通过 Relation 连接。

不要修改历史。

---

# 7. 核心表

v0.1 使用以下核心表：

* node
* node_message
* node_interpretation
* relation
* evidence
* task

v0.1 不存在独立 decision 表。

Decision 表示为：

node.node_type = decision

---

# 8. node

## 用途

存储认知对象的稳定元信息。

## 最小字段

id

node_type

title

lifecycle_status

created_at

updated_at

archived_at

## node_type Values

spark

reasoning

decision_prep

decision

## lifecycle_status Values

open

closed

archived

## 规则

Node 不存储完整的持续演化内容。

Node 只存储稳定对象级元信息。

---

# 9. node_message

## 用途

存储一个 Node 内部 append-only 的内容事件。

## 最小字段

id

node_id

role

content

message_type

created_at

## role Values

user

agent

system

## message_type Values

original

reply

reasoning

decision_prep

decision

correction

edit

command_result

## Append-only Rule

node_message 在 v0.1 中是 append-only。

已有 message 不覆盖。

如果用户编辑或修正内容，系统追加新 message。

## 展示规则

Node 详情页按 created_at 升序展示 messages。

Node 卡片摘要使用 node.title 加最新相关 node_message。

---

# 10. node_interpretation

## 用途

存储用于搜索和 Discovery 的结构化理解。

它是索引层。

它不是事实层。

它不是能力层。

## 最小字段

id

node_id

entities_json

keywords_json

extraction_version

created_at

## 允许存储

entities

keywords

extraction_version

created_at

## 禁止存储

confidence

importance

summary

concept

insight

attention_pattern

## 版本规则

一个 Node 可以有多条 node_interpretation records。

系统默认读取最新版本。

历史 interpretations 保留。

---

# 11. relation

## 用途

存储 Nodes 之间的认知关系。

Relation 是唯一的认知关系系统。

## 最小字段

id

source_node_id

target_node_id

relation_type

relation_reason

status

created_by

created_at

## relation_type Values

derived_from

related

supports

contradicts

## 方向规则

derived_from 是有向关系。

supports 是有向关系。

contradicts 是有向关系。

related 在逻辑上是无向关系，但数据库中按规范顺序存储。

对于 related：

source_node_id = 字典序较小的 id

target_node_id = 字典序较大的 id

## status Values

suggested

confirmed

dismissed

Discovery 生成的 relations 默认为：

status = suggested

用户确认后：

status = confirmed

用户拒绝后：

status = dismissed

dismissed relations 不删除。

## created_by Values

user

agent

system

## 去重规则

不允许重复 active relations。

唯一性 key：

source_node_id

target_node_id

relation_type

status in suggested or confirmed

dismissed relations 保留为历史。

---

# 12. evidence

## 用途

存储事实材料。

Evidence 不是 Node。

Evidence 不参与 Relation graph。

Evidence 挂载到一个 target。

## 最小字段

id

target_type

target_id

evidence_type

stance

content

source

source_url

created_at

## target_type Values

node

relation

## stance Values

supports

contradicts

neutral

## evidence_type Values

fact

data

document

experience

radius1_result

## 规则

如果 target_type = node，Evidence 支持、反驳或中性记录某个 Node。

如果 target_type = relation，Evidence 支持、反驳或中性记录某个 Relation。

Evidence 不替代 Relation。

Relation 不替代 Evidence。

---

# 13. task

## 用途

Task 表示需要用户关注的对象。

Task 不限于 Discovery。

## 最小字段

id

node_id

task_type

source_type

content

status

remind_count

last_remind_at

next_remind_at

archived_at

created_at

updated_at

## task_type Values

spark_follow_up

discovery_expand

verify

review

manual

## source_type Values

spark

discovery

user

system

## status Values

pending

sleeping

completed

---

# 14. Task 状态机

允许的状态流转：

pending → completed

pending → sleeping

sleeping → pending

sleeping → completed

completed 在 v0.1 中是终态。

completed tasks 不重新打开。

如果一个 completed task 后续重新相关，则创建新的 task。

---

# 15. Reminder Engine

Reminder cadence 不是状态。

Reminder cadence 通过以下字段存储：

remind_count

last_remind_at

next_remind_at

## 默认节奏

Task 创建时：

status = pending

remind_count = 0

next_remind_at = 当天 21:00

## 无响应

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

完成 task：

pending → completed

sleeping → completed

延后 task：

status 保持 pending

next_remind_at 更新

忽略 task：

不立即改变 status

Reminder Engine 继续推进 cadence

---

# 16. Task Revival

Sleeping tasks 可以被重新激活。

## Revival Triggers

New Spark

New Evidence

New Relation

New Discovery Result

Similar issue reappears

## Revival Transition

sleeping → pending

重新激活时：

remind_count = 0

last_remind_at = null

next_remind_at = 下一次计划提醒时间

---

# 17. Input Classifier

Input Classifier 将用户输入分类为：

Spark

Chat

Command

## 默认规则

模糊输入默认 Spark。

这遵循 high-recall strategy。

漏掉一个 Spark 比多收一个 Spark 更糟糕。

## Spark Persistence

Spark 创建：

Spark Node

node_message

node_interpretation

Spark Task

## Chat Persistence

Chat 默认不创建 Node。

Chat 是运行时交互。

如果用户明确要求保存内容，系统创建合适的 Node。

## Command Persistence

Command 默认不创建 Node。

Command 执行系统动作。

Command 可以更新：

Task status

Node lifecycle_status

Relation status

archived_at

next_remind_at

只有当 command 明确需要创建新的认知对象时，Command 才创建 Node。

---

# 18. Spark Workflow

用户输入被分类为 Spark 后：

Create Spark Node

Append original node_message

Create node_interpretation

Create spark_follow_up Task

Run minimal Discovery

Return response to user

## Spark Task

每个 Spark 都会创建 Spark Task。

task_type = spark_follow_up

source_type = spark

目的：

防止 Spark 静默沉底。

---

# 19. Discovery Engine

## 用途

Discovery 发现值得关注的东西。

Discovery 不做最终决策。

Discovery 在 v0.1 中不创建 Concepts。

Discovery 在 v0.1 中不创建 Attention Patterns。

## v0.1 Must-have

related Spark discovery

duplicate / recurring Spark discovery

Spark Task creation

Discovery Task creation

Task Revival

## v0.1 Basic

simple contradiction detection

simple anomaly detection

## v0.1 Optional

Radius1 fact verification

historical counterexample discovery

Optional items 不阻塞 MVP 完成。

---

# 20. Discovery Task

Discovery 可以创建 Discovery Task。

task_type = discovery_expand

source_type = discovery

目的：

提醒用户检查一个被发现的 relation、recurrence、contradiction 或 anomaly。

---

# 21. Radius Model

## Radius1

Radius1 验证事实。

问题：

这是真的吗？

Radius1 只在 Spark 包含清晰可验证实体时自动运行，例如：

company

product

policy

event

person

public data

Radius1 结果存储为 Evidence。

Radius1 不生成解释、策略、Concept 或 Attention Pattern。

## Radius2

Radius2 解释意义。

问题：

这意味着什么？

Radius2 需要用户授权。

Radius2 在 v0.1 中不自动运行。

---

# 22. Discovery Feed

Discovery Feed 是首页。

产品名称：

Agent观察日报

## 用途

展示 DragonMind 认为当前值得用户关注的东西。

## Feed Items May Include

related Sparks

repeated Sparks

contradictions

anomalies

historical counterexamples

Task Revival

Radius1 verification results

pending Spark follow-ups

Discovery Tasks

## 排序

Discovery Feed 按 Runtime Importance 排序。

Importance score 不存储。

它在查询时实时计算。

## Runtime Importance Inputs

pending task existence

number of related nodes

relation type

contradiction existence

recurrence count

revived task flag

recentness

unhandled duration

node_type

evidence existence

Radius1 result existence

只存储事实输入。

不要存储 importance score。

---

# 23. Workspace

Workspace 是工作区。

Workspace 不是首页。

Workspace 包含以下 filters：

Inbox

Active

Decision

All

## Inbox

展示 pending tasks 及其相关 Nodes。

## Active

展示 open Reasoning 和 Decision Prep Nodes。

也展示有 pending tasks 的 Nodes。

## Decision

展示 Decision Prep 和 Decision Nodes。

## All

展示所有非 archived Nodes。

---

# 24. Archive

Archive 是状态。

Archive 不移动、不复制、不删除数据。

## Node Archive

Node archive 表示为：

lifecycle_status = archived

archived_at = timestamp

## Archived Objects

已归档对象：

默认不出现在 Workspace

默认不生成提醒

仍可搜索

可用于历史反例

可被未来 Discovery 引用

## Relation and Evidence

Relation 和 Evidence 在 v0.1 中不单独归档。

它们继续挂载到原 targets 上。

---

# 25. Decision

Decision 是一种 Node Type。

Decision 在 v0.1 中不是独立表。

Decision 表示为：

node.node_type = decision

Decision 内容存储在 node_message 中。

Decision 通过 Relation 连接到 Decision Prep：

decision derived_from decision_prep

Decision 可以表示：

选择方案 A

选择方案 B

选择等待

选择不行动

未来 Outcome 和 Review Nodes 会连接到 Decision。

---

# 26. 最小 API 资源边界

v0.1 应暴露轻量资源：

nodes

messages

relations

evidence

tasks

discovery-feed

commands

这是资源边界，不是完整 OpenAPI specification。

## Required Actions

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

# 27. v0.1 Non-goals

v0.1 不实现：

Concept generation

Insight generation

Attention Pattern learning

Outcome Review loop

Multi-user support

Cloud sync

Vector database

Full autonomous agent behavior

Full long-term memory engine

Conversation management system

Project management system

---

# 28. 成功标准

v0.1 成功标准：

用户可以快速记录 Sparks。

每个 Spark 都创建可检索 Node。

每个 Spark 都创建 Spark Task。

Discovery 可以发现基础 related 或 repeated Sparks。

Discovery Feed 可以展示 Agent观察日报。

用户可以推进：

Spark → Reasoning → Decision Prep → Decision

Task Reminder Engine 可支持：

pending

sleeping

completed

Archive 不删除历史。

连续使用两周后，核心数据库结构不需要重做。

---

# 29. 实现就绪状态

应用 Patch v1.3 后，DragonMind v0.1 可以进入 implementation planning。

完整编码前，应生成：

08_IMPLEMENTATION_PLAN.md

Implementation Plan 必须只基于本文档。
