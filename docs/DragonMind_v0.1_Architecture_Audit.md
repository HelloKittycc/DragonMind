# DragonMind v0.1 Architecture Audit

Audit Role: Staff Software Engineer / Software Architect

Source of Truth: `DragonMind_v0.1_Spec.md`

Scope: Engineering implementation audit only. This document does not redesign product vision, add product features, discuss business value, or introduce new modules beyond what is required for v0.1 correctness.

---

# Critical Issues

## 1. Task 状态机不完整且存在语义歧义

### 问题描述

文档定义 Task 生命周期为：

`pending -> sleeping -> completed`

同时又定义 sleeping task 可被重新激活：

`sleeping -> pending`

但没有说明：

* `pending` 是否可以直接 `completed`
* `completed` 是否终态
* reminder 节奏中的“当天 / 7天 / 30天 / sleeping”是状态、时间点还是调度策略
* 用户主动完成、忽略、延后、系统自动沉睡分别如何落库

### 为什么这是问题

Reminder Engine 是 v0.1 的核心闭环之一。如果 Task 状态机不严谨，后端 API、定时任务、前端列表、Discovery Feed 都会对同一个 Task 得出不同解释，直接影响 MVP 正确性。

### 建议修改方式

最小修改：补充 Task 状态转移表。

建议至少明确：

* `pending -> completed`
* `pending -> sleeping`
* `sleeping -> pending`
* `sleeping -> completed`
* `completed` 为终态，除非明确允许 reopen
* reminder cadence 是 Task 的调度字段，不是状态

### 修改成本评估

低。只需补充规格，不需要改变现有架构方向。

---

## 2. Evidence 的数据归属和连接关系缺失

### 问题描述

文档列出 `evidence` 表，并要求 Radius1 做事实验证、Discovery Feed 展示 Radius1 验证结果。但没有说明 Evidence 连接到什么对象：

* Evidence 属于 Node？
* 属于 Relation？
* 属于某一次 Radius1 验证？
* Evidence 是否也通过 Relation 连接？
* Evidence 是否可复用？
* Evidence 如何表达支持或反驳？

### 为什么这是问题

“Fact First”和 Radius1 是规格核心。如果 Evidence 不能稳定连接到被验证对象，事实验证结果无法可靠查询、无法解释、无法归档，也无法满足“Explainable Only”。

### 建议修改方式

最小修改：明确 Evidence 的最小归属模型。

例如规定：

* `evidence` 必须关联一个 `target_type` / `target_id`，目标只能是 `node` 或 `relation`
* Evidence 记录来源、摘录、验证结论、创建时间
* Evidence 对目标的语义为 `supports` / `contradicts` / `neutral`
* 如果坚持 Relation 是唯一关系系统，则需要说明 Evidence 是否参与 Relation；否则明确 Evidence 是事实材料，不属于认知对象关系图

### 修改成本评估

中低。需要补充表字段和约束，但不需要引入新模块。

---

## 3. Relation 语义不足以支撑核心工作流

### 问题描述

文档规定 Relation 支持：

* `derived_from`
* `related`
* `supports`
* `contradicts`

并且 Relation 是唯一关系系统。但没有定义：

* 方向性
* 是否允许重复关系
* 是否允许同一对 Node 同时存在多个关系类型
* `derived_from` 是否用于 Spark -> Reasoning -> Decision Prep -> Decision
* Relation 是否需要解释字段
* Relation 是否由用户确认后才算长期关系
* Discovery 自动生成的 Relation 和用户确认的 Relation 是否有区别

### 为什么这是问题

Node 永不覆盖，阶段推进完全依赖 Relation。如果 Relation 的方向、来源、唯一性、确认状态不清楚，闭环链路会无法稳定重建，重复发现和冲突发现也会产生大量不可控重复数据。

### 建议修改方式

最小修改：补充 Relation 约束。

建议明确：

* Relation 是有向还是无向；若 `related` 无向，也要指定存储规范
* `derived_from` / `supports` / `contradicts` 为有向
* Relation 必须有 `source_node_id`、`target_node_id`、`type`、`created_by`、`created_at`
* Discovery 生成的 Relation 需要有 `status`，例如 `suggested` / `confirmed` / `dismissed`
* 同一关系的去重规则

### 修改成本评估

中。需要影响数据库约束和 Discovery 写入逻辑，但这是 v0.1 实现前必须定下来的基础。

---

## 4. Node 与 node_message 的边界不清，影响不可变模型

### 问题描述

文档强调 Node 永不覆盖，每个阶段创建新 Node。但没有说明：

* Node 存什么
* node_message 存什么
* 一个 Node 是否可以有多条 message
* 用户编辑输入时是修改 message，还是追加 message，还是创建新 Node
* Reasoning / Decision Prep / Decision 的内容是 Node 字段还是 message 字段

### 为什么这是问题

不可变模型只有在“什么不可变”被定义清楚时才成立。否则实现时很容易出现 Node 不变但 message 被覆盖，或者 message 追加后无法确定当前版本的问题。

### 建议修改方式

最小修改：补充 Node / Message 分工。

建议规定：

* `node` 保存稳定元信息：id、type、created_at、archived_at 等
* `node_message` 保存用户或系统产生的原始内容，默认 append-only
* 如果允许编辑，必须通过新 message 或 message revision 表达，不覆盖历史
* 当前展示内容的选择规则必须明确

### 修改成本评估

中低。主要是规格补充和少量字段设计。

---

# Important Issues

## 1. v0.1 Discovery 范围偏宽，存在实现风险

### 问题描述

Discovery Engine 同时负责：

* 关联发现
* 重复发现
* 冲突发现
* 异常发现
* Radius1 事实验证
* 历史反例
* Task Revival

### 为什么这是问题

这些能力的工程复杂度差异很大。关联和重复可以基于关键词 / entity 做 MVP；冲突、异常、历史反例、事实验证都需要更明确的数据来源和判定标准。全部纳入 v0.1 容易造成实现质量不稳定。

### 建议修改方式

不改变产品范围，只建议为 v0.1 定义能力等级：

* 必做：关联、重复、Task Revival
* 可做但需降级：冲突、异常、Radius1
* 明确每类 Discovery 的最小可解释依据

### 修改成本评估

低。属于验收标准澄清，不需要重构架构。

---

## 2. Runtime Importance 不入库合理，但缺少确定性输入

### 问题描述

Discovery Feed 使用 Runtime Importance 排序，且 Importance 不入库。但没有定义实时排序依据。

### 为什么这是问题

不入库是合理的，但排序函数必须可重复、可解释。否则用户每次打开 Feed 顺序变化，工程上也难以测试。

### 建议修改方式

最小修改：定义 Runtime Importance 的输入项，例如：

* Task 是否 pending
* Relation 类型
* 是否 Radius1 结果
* 是否 revived
* 最近创建时间
* 是否用户未处理

不需要保存 importance 分数，只需要保存排序所依赖的事实字段。

### 修改成本评估

低。

---

## 3. Input Classifier 的输出与后续对象创建规则不完整

### 问题描述

Input Classifier 支持 Spark / Chat / Command，模糊默认 Spark。但文档没有说明 Chat 和 Command 是否创建 Node、Message、Task，或者只是运行时交互。

### 为什么这是问题

这会直接影响 API 和数据一致性。尤其文档明确“不是聊天机器人”，但又有 Chat 类型。如果 Chat 不入库，要明确；如果入库，要避免引入 Conversation 模型。

### 建议修改方式

最小修改：

* Spark：创建 Spark Node 和 node_message
* Chat：不创建 Node，或仅作为临时响应，不进入长期资产
* Command：执行系统动作，可产生 Task / Relation / Node，但必须由命令类型决定

### 修改成本评估

低。

---

## 4. Archive 语义与“禁止删除历史”之间还不够可实现

### 问题描述

Archive 部分说“归档认知资产，禁止删除历史，保留 Node / Message / Relation / Evidence / Decision”。但没有定义归档是：

* 一个状态字段
* 一个视图
* 一个时间戳
* 还是对象移动

### 为什么这是问题

如果归档实现为移动或复制，会破坏 Graph First 的查询一致性。如果只是状态字段，需要明确归档是否影响 Discovery、Reminder、Workspace。

### 建议修改方式

最小修改：

* Archive 是对象状态，不移动数据
* Node / Task 可有 `archived_at`
* Relation / Evidence 不单独归档，随查询策略展示
* 已归档对象默认不参与新提醒，但仍可被检索和作为历史反例

### 修改成本评估

低。

---

## 5. Decision 既是 Node Type 又在 Archive 中像独立对象

### 问题描述

文档中 Decision 是 v0.1 Node Type，但 Archive 保留列表里单独写了 Decision，容易让实现者误以为需要独立 `decision` 表。

### 为什么这是问题

会造成数据模型分裂：Decision 到底是 `node.type = decision`，还是单独实体？这会影响 API、查询和闭环链路。

### 建议修改方式

最小修改：明确 Decision 是 Node 的一种类型，不是独立核心表。除非需要特有字段，否则不要增加 decision 表。

### 修改成本评估

极低。

---

# Optional Improvements

## 1. 补充最小 API 资源边界

### 问题描述

当前文档没有 API 设计，但已有核心对象。

### 优化价值

可以降低前后端和服务层实现歧义，尤其是 Node 创建、阶段推进、Task 完成、Discovery Feed 查询。

### 是否建议现在处理

建议轻量处理。只需要列资源和动作，不需要完整 OpenAPI。

---

## 2. 给 Node Type 增加允许的阶段推进规则

### 问题描述

文档展示 Spark -> Reasoning -> Decision Prep -> Decision，但没有说是否允许跳过、回退、分叉。

### 优化价值

能让 `derived_from` 链路更稳定，也方便测试 Success Criteria。

### 是否建议现在处理

建议现在处理，但保持最小规则即可。

---

## 3. 明确 node_interpretation 的版本语义

### 问题描述

`node_interpretation` 允许 `version`，但未说明一个 Node 是否允许多个 interpretation。

### 优化价值

有助于后续模型升级或解析规则升级时不破坏历史索引。

### 是否建议现在处理

可以现在补一句：允许多版本 interpretation，默认读取最新版本，历史版本保留。

---

# Architecture Score

**7 / 10**

理由：

整体方向是清楚的：Graph First、Node 不覆盖、Relation 表达关系、Discovery 只负责发现、Importance 不长期入库，这些决策能避免 v0.1 过早引入复杂模块，也符合“先记录、后分析”的原则。

主要扣分来自工程可落地性不足：核心表只有名称，没有最小字段和约束；Task 状态机不完整；Evidence 和 Relation 的边界不够清楚；Discovery 范围对 MVP 偏重。

这些不是产品愿景问题，而是实现前必须补齐的结构定义问题。

---

# Implementation Readiness

**不建议立刻进入完整开发阶段。**

建议先修正以下问题：

1. Task 状态机和 reminder cadence
2. Evidence 归属与 Radius1 结果落库方式
3. Relation 的方向、来源、状态、去重规则
4. Node 与 node_message 的不可变边界
5. Decision 是否只是 Node Type

修完这些后，可以进入开发。

第一阶段开发建议优先实现：

1. Core Data Layer：`node`、`node_message`、`node_interpretation`、`relation`、`evidence`、`task`
2. Spark 创建流程：输入 -> Spark Node -> node_message -> spark_follow_up Task
3. 阶段推进流程：Spark -> Reasoning -> Decision Prep -> Decision，通过 `derived_from` 连接
4. Task Reminder Engine：pending / sleeping / completed 状态和调度
5. 最小 Discovery：关联、重复、冲突提示、Discovery Task 生成

结论：架构方向可以保留，不需要推翻；但需要补齐几处最小工程约束，否则 v0.1 会在实现阶段产生数据模型分叉和状态一致性问题。
