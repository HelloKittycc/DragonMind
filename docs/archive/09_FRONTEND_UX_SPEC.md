# DragonMind v0.1 Frontend UX Spec

文件名：09_FRONTEND_UX_SPEC.md

状态：Frontend UX Pass

适用范围：v0.1 前端重构

唯一依据：

* docs/DragonMind_v0.1_Spec.md
* 08_IMPLEMENTATION_PLAN.md
* 当前 Day 1 / Day 2 / Day 3 已实现功能

---

# 1. 目标

本 UX Spec 的目标不是新增功能。

本 UX Spec 的目标是把当前工程验证界面重构为真正的 DragonMind v0.1 产品界面。

当前前端已经证明核心系统能跑通：

* Spark capture
* Node detail
* Stage progression
* Relation
* Task
* Evidence
* Archive
* Discovery Feed
* Workspace

但当前界面仍然偏向数据库 CRUD / 工程验证界面。

v0.1 前端重构目标是：

让 DragonMind 看起来像一个个人认知参谋，而不是后台管理系统。

---

# 2. 前端重构边界

## 允许

允许修改：

* 页面布局
* 组件结构
* CSS / visual style
* feed item 文案
* button 文案
* card 信息层级
* 前端数据映射逻辑
* 空状态
* loading 状态
* error 状态
* 移动端布局
* 桌面端布局

## 不允许

不允许修改：

* 数据库 schema
* 后端核心 API
* Task 状态机
* Relation 语义
* Evidence 模型
* Node / node_message / node_interpretation 边界
* Discovery 计算逻辑
* Runtime Importance 入库规则
* v0.1 产品范围

## 不新增

不新增：

* Knowledge ingestion
* Radius1
* historical counterexample discovery
* Concept
* Insight
* Attention Pattern
* Outcome / Review
* Vector DB
* Cloud Sync
* Multi-user
* Conversation management
* Project management

---

# 3. 产品体验定位

DragonMind v0.1 前端应该像：

个人认知参谋的每日观察台。

不应该像：

数据库 CRUD 后台。

核心体验是：

每天打开 DragonMind，第一眼看到：

“今天有什么值得我提高关注度？”

而不是：

“数据库里有哪些对象？”

---

# 4. 信息架构

v0.1 前端包含三个主区域：

1. Agent观察日报
2. Node Detail
3. Workspace

优先级：

Agent观察日报

↓

Node Detail

↓

Workspace

---

# 5. 顶层导航

桌面端顶部导航：

* Agent观察日报
* Workspace
* New Spark

移动端底部导航：

* 观察
* 工作区
* 记录

说明：

首页永远是 Agent观察日报。

Workspace 不是首页。

New Spark 是快速入口，不应占据首页首屏大量空间。

---

# 6. 视觉风格

## 关键词

* 冷静
* 克制
* 清晰
* 专业
* 可信
* 像参谋简报
* 像每日认知台
* 不像 SaaS 后台
* 不像项目管理工具

## 色彩建议

背景：

* 温和浅色背景
* 避免纯白刺眼
* 可使用轻微米白 / 灰白

主色：

* 低饱和绿色或墨绿色
* 用于主要行动和高关注提示

强调色：

* 风险 / 冲突 / 异常 可使用低饱和橙色或红棕色
* 不要使用强烈警报红，避免焦虑感

文本：

* 标题深色
* 元信息灰绿色 / 灰色
* 内容正文清晰可读

## 字体与密度

要求：

* 移动端优先
* 卡片留白充足
* 不要把工程字段直接摊给用户
* 不要显示过多 enum
* 不要使用过密表格

---

# 7. 语言原则

前端文案必须是产品语言，而不是数据库语言。

## 禁止直接展示

不要直接展示：

* repeated_sparks
* pending_spark_follow_up
* discovery_expand
* runtime 85
* node_type
* lifecycle_status
* task_type
* source_type
* relation_type
* created_by
* message_type

这些可以作为 debug 信息存在，但不应作为默认用户界面。

## 应转换为用户语言

### repeated_sparks

显示为：

重复出现

或：

我发现这个问题最近反复出现

### related_sparks

显示为：

关联增强

或：

我发现它和之前的记录有关

### pending_spark_follow_up

显示为：

待展开想法

或：

这个想法还没有展开

### discovery_expand

显示为：

建议展开

或：

值得进一步看看

### contradiction

显示为：

出现冲突

或：

这和之前的判断不一致

### anomaly

显示为：

异常变化

或：

这里出现了不寻常的变化

### evidence

显示为：

有新证据

或：

有资料支持 / 有资料相反

### runtime importance

不要显示为：

runtime 85

显示为：

高关注

中关注

低关注

或：

优先看

可以稍后

仅记录

---

# 8. Agent观察日报 页面

路径：

* /
* /discovery-feed

页面标题：

Agent观察日报

副标题：

今天值得你提高关注度的事项。

可选显示日期：

2026年6月25日

---

## 8.1 页面结构

Agent观察日报 页面从上到下：

1. Header
2. 今日简报摘要
3. 快速记录入口
4. 高关注事项
5. 重复出现
6. 关联增强
7. 待展开想法
8. 最近记录

---

## 8.2 Header

左侧：

Agent观察日报

副标题：

今天值得你提高关注度的事项

右侧：

Workspace

New Spark

移动端：

右上角只保留 “+”

---

## 8.3 今日简报摘要

顶部增加一个简短 summary card。

示例：

今天我发现 3 件值得关注的事：

* 1 个问题重复出现
* 2 条 Spark 尚未展开
* 1 条记录和历史内容有关

如果没有 feed items：

今天没有明显异常。你可以先记录一个新想法。

---

## 8.4 快速记录入口

当前输入框太占首屏。

应改成 collapsed quick capture。

默认显示为一行：

* 记录一个新想法

点击后展开：

Title optional

Spark textarea

按钮：

保存并观察

取消

说明：

首页的主角是观察日报，不是输入表单。

输入是入口，但不应压过 Feed。

---

## 8.5 Feed Item Card

每个 Feed item 必须像一条参谋观察，而不是数据库记录。

Card 结构：

1. Attention Badge
2. Observation Title
3. Plain-language Explanation
4. Reason / Evidence Line
5. Related Objects
6. Actions

---

## 8.6 Attention Badge

可用：

高关注

中关注

低关注

待处理

重复出现

关联增强

出现冲突

有新证据

不要显示：

runtime 85

---

## 8.7 Observation Title

标题应使用自然语言。

不要显示：

拓科渠道转化下滑

repeated_sparks runtime 85

应该显示：

我发现：“渠道转化下滑”正在重复出现

或者：

这个问题不是第一次出现了

---

## 8.8 Explanation

每个 card 至少有一句解释。

示例：

最近你记录了多条与“渠道转化下滑”相关的 Spark。这可能不是孤立事件，建议展开看看是否存在共同原因。

示例：

这条 Spark 和之前关于“商务渠道转化下滑”的记录相似，系统已建立 suggested relation。

示例：

这个想法已经记录，但还没有展开。如果它仍然重要，可以进入 Reasoning。

---

## 8.9 Reason / Evidence Line

用人话解释系统为什么展示它。

示例：

原因：最近 7 天内出现 2 次相似记录。

示例：

原因：它与 1 条历史 Spark 相关。

示例：

原因：该 Spark 仍有 pending follow-up task。

不要显示原始 technical fields。

---

## 8.10 Related Objects

显示最多 3 个相关对象。

例如：

相关记录：

* 商务渠道转化下滑
* 拓科渠道转化下滑

点击进入 Node Detail。

如果超过 3 个，显示：

查看全部 5 条相关记录

---

## 8.11 Feed Actions

主要按钮：

展开分析

次要按钮：

查看相关记录

暂时忽略

完成

可选：

归档

不同 feed type 的 action：

### pending_spark_follow_up

主按钮：

展开分析

次按钮：

稍后提醒

完成

### repeated_sparks

主按钮：

查看重复记录

次按钮：

展开分析

暂时忽略

### related_sparks / relation

主按钮：

查看关联

次按钮：

确认关联

dismiss

### evidence

主按钮：

查看证据

次按钮：

关联到节点

### anomaly / contradiction

主按钮：

展开分析

次按钮：

查看来源

暂时忽略

---

# 9. Feed Item Type 映射

后端 feed type 到前端产品类型映射：

## pending_spark_follow_up

Card 类型：

待展开想法

标题：

这个想法还没有展开

解释：

你记录了这条 Spark，但还没有进入 Reasoning。若它仍值得关注，可以展开分析。

## repeated_sparks

Card 类型：

重复出现

标题：

我发现一个问题正在重复出现

解释：

最近出现了多条相似 Spark，可能代表一个正在形成的趋势。

## related_sparks

Card 类型：

关联增强

标题：

我发现它和之前的记录有关

解释：

这条 Spark 与历史记录存在相似关键词或实体，建议查看是否属于同一问题。

## relation

Card 类型：

新关联

标题：

我发现两个认知对象之间可能有关

解释：

系统发现两条记录之间存在相关性，当前关系状态为 suggested。

不要直接显示：

relation_type = related

## evidence

Card 类型：

有新证据

标题：

有资料支持 / 反驳某条记录

解释：

这条 Evidence 被挂载到某个 Node 或 Relation，可用于后续判断。

## task_revival

Card 类型：

重新变得重要

标题：

一个休眠事项重新值得关注

解释：

新的 Spark / Relation / Evidence 让一个 sleeping task 重新变为 pending。

---

# 10. Node Detail 页面

路径：

/nodes/[id]

Node Detail 是认知对象详情页，不是聊天窗口。

目标：

让用户理解这个 Node 的来龙去脉，并继续推进认知链路。

---

## 10.1 页面结构

从上到下：

1. Node Header
2. Primary Action
3. Cognitive Timeline
4. Related Discoveries
5. Tasks
6. Evidence
7. Relations
8. Danger / Archive Zone

---

## 10.2 Node Header

显示：

* 标题
* 类型中文名
* 状态中文名
* 创建时间
* 归档状态

类型映射：

spark → Spark / 想法

reasoning → Reasoning / 推理

decision_prep → Decision Prep / 决策准备

decision → Decision / 决策

状态映射：

open → 进行中

closed → 已关闭

archived → 已归档

不要只显示：

spark · open

可以显示：

Spark · 进行中

---

## 10.3 Primary Action

根据 node_type 显示主操作。

### Spark

主按钮：

展开为 Reasoning

说明：

把这个想法展开成一段推理。

### Reasoning

主按钮：

生成 Decision Prep

说明：

把当前推理整理成决策准备材料。

### Decision Prep

主按钮：

记录 Decision

说明：

记录你的最终选择。

### Decision

主按钮：

查看决策链路

说明：

Decision 是当前 v0.1 认知链路终点。

---

## 10.4 Cognitive Timeline

原 Messages 区域改名为：

认知时间线

每条 message 以时间线形式展示。

message_type 映射：

original → 原始记录

reply → 补充记录

reasoning → 推理

decision_prep → 决策准备

decision → 最终决策

correction → 修正

edit → 编辑

command_result → 系统操作

role 映射：

user → 你

agent → DragonMind

system → 系统

示例：

你 · 原始记录 · 15:06

存储疯涨

你 · 补充记录 · 15:08

上传资料

---

## 10.5 Append Message

当前 “Append message” 改成：

补充记录

Placeholder：

补充新的观察、修正或背景信息……

按钮：

保存补充

可选 message_type selector：

* 补充
* 修正
* 编辑

默认：

reply

---

## 10.6 Related Discoveries

展示当前 Node 相关的 Discovery。

包括：

* 重复出现
* 相关 Spark
* suggested relation
* contradiction
* anomaly

如果无内容：

暂时没有发现明显关联。

---

## 10.7 Task Panel

标题：

待处理事项

Task 展示不应是 raw task_type。

task_type 映射：

spark_follow_up → 待展开

discovery_expand → 建议展开

verify → 待验证

review → 待复盘

manual → 手动任务

状态映射：

pending → 待处理

sleeping → 已休眠

completed → 已完成

按钮：

完成

延后

休眠

重新激活

---

## 10.8 Evidence Panel

标题：

证据与资料

Evidence card 显示：

* stance 中文
* evidence_type 中文
* content
* source
* source_url

stance 映射：

supports → 支持

contradicts → 反驳

neutral → 中性记录

evidence_type 映射：

fact → 事实

data → 数据

document → 文档

experience → 经验

radius1_result → Radius1 结果

按钮：

添加 Evidence

---

## 10.9 Relation Panel

标题：

相关对象

Relation card 显示：

* relation type 中文
* relation reason
* related Node title
* relation status 中文

relation_type 映射：

derived_from → 来源于

related → 相关

supports → 支持

contradicts → 冲突

status 映射：

suggested → 待确认

confirmed → 已确认

dismissed → 已忽略

按钮：

确认关联

忽略关联

打开相关对象

---

# 11. Workspace 页面

路径：

/workspace

Workspace 是工作区，不是首页。

目标：

让用户管理所有认知对象和任务。

---

## 11.1 页面结构

1. Header
2. Filter Tabs
3. List Summary
4. Node Cards

---

## 11.2 Header

标题：

Workspace

副标题：

管理你的认知对象、任务和决策链路。

右侧：

Agent观察日报

New Spark

---

## 11.3 Filter Tabs

Tabs：

Inbox

Active

Decision

All

保留英文也可以，但建议加入中文解释。

Inbox：

待处理

Active：

进行中

Decision：

决策

All：

全部

可显示为：

Inbox 待处理

Active 进行中

Decision 决策

All 全部

---

## 11.4 Node Cards

不要显示：

spark · open · pending tasks 1

改成：

Spark · 进行中

待处理 1

Card 内容：

* 标题
* 最新 message 摘要
* 类型 badge
* 状态 badge
* pending task count
* 最近更新时间
* 操作按钮

按钮：

打开

展开分析

归档

---

# 12. New Spark / Input Capture

输入体验要轻。

不要让大表单占据首页首屏。

---

## 12.1 默认状态

显示为一条 compact input：

* 记录一个新想法

点击后展开。

---

## 12.2 展开状态

字段：

Title optional

Spark content

按钮：

保存并观察

取消

说明：

Title optional 不应强调。

更好的文案：

标题，可选

Placeholder：

记录一个观察、担忧、假设或突然冒出来的想法……

---

## 12.3 创建成功

创建成功后不要只跳转。

显示轻提示：

已记录。DragonMind 会检查它是否和历史内容有关。

按钮：

查看详情

继续记录

---

# 13. 移动端设计

v0.1 必须移动端可用。

目标宽度：

390px

移动端优先级：

1. Agent观察日报
2. 快速记录
3. Feed item actions
4. Node Detail timeline
5. Workspace filters

---

## 13.1 Mobile Header

首页：

Agent观察日报

右上角：

*

底部导航：

观察

工作区

记录

---

## 13.2 Mobile Feed Card

每张卡片只显示：

* badge
* title
* explanation
* main action
* secondary action menu

避免一张卡里堆太多字段。

---

## 13.3 Mobile Node Detail

Node Detail 使用折叠区：

* 认知时间线
* 待处理事项
* 相关对象
* 证据与资料

默认展开：

认知时间线

待处理事项

---

# 14. Empty States

## Discovery Feed 空状态

标题：

今天暂时没有明显异常

说明：

你可以先记录一个新想法，DragonMind 会帮你检查它是否与历史内容有关。

按钮：

记录新想法

## Workspace 空状态

标题：

这里还没有内容

说明：

记录 Spark 后，它会出现在这里。

按钮：

记录 Spark

## Node Detail 无关系

标题：

暂时没有发现相关对象

说明：

当类似 Spark 或相关证据出现时，会在这里显示。

---

# 15. Loading / Error States

所有页面必须有基础 loading 和 error。

## Loading

文案：

正在整理观察……

正在读取认知对象……

## Error

文案：

读取失败。请稍后重试。

按钮：

重试

不要显示 raw stack trace。

---

# 16. Debug 信息

默认用户界面不显示 debug 信息。

允许在开发模式下显示：

* raw feed_type
* runtime importance score
* node_id
* task_id
* relation_id

但必须放在折叠 debug 区域。

不要出现在默认 card 主视觉中。

---

# 17. 前端组件建议

可以重构为以下组件：

## layout

* AppShell
* TopNav
* MobileBottomNav
* PageHeader

## input

* QuickCapture
* ExpandedSparkForm

## feed

* DiscoveryFeedPage
* DailyBriefSummary
* FeedSection
* FeedItemCard
* FeedItemActions
* FeedTypeBadge

## nodes

* NodeDetailPage
* NodeHeader
* CognitiveTimeline
* TimelineMessage
* StageProgressionPanel
* NodeCard
* RelationPanel

## tasks

* TaskPanel
* TaskCard
* TaskActions

## evidence

* EvidencePanel
* EvidenceCard
* AddEvidenceForm

## workspace

* WorkspacePage
* WorkspaceTabs
* WorkspaceNodeList

---

# 18. Copywriting Examples

## Feed Card: repeated_sparks

Badge：

重复出现

Title：

我发现：“渠道转化下滑”正在重复出现

Explanation：

最近你记录了多条与“渠道转化下滑”相关的 Spark。这可能不是孤立事件，建议展开看看是否存在共同原因。

Reason：

原因：最近出现了 2 条相似记录。

Actions：

展开分析

查看相关记录

暂时忽略

---

## Feed Card: pending_spark_follow_up

Badge：

待展开

Title：

这个想法还没有展开

Explanation：

你已经记录了这条 Spark，但它还没有进入 Reasoning。如果它仍然重要，可以把它展开成一段推理。

Actions：

展开分析

稍后提醒

完成

---

## Feed Card: related_sparks

Badge：

关联增强

Title：

我发现它和之前的记录有关

Explanation：

这条 Spark 与历史记录存在相似关键词或实体，建议查看是否属于同一问题。

Actions：

查看关联

确认关联

忽略

---

## Node Detail: Spark Header

Spark · 进行中

原始想法

Primary CTA：

展开为 Reasoning

Description：

把这个想法展开成一段推理。

---

# 19. 验收标准

本轮前端重构通过标准：

1. 首页仍然是 Agent观察日报。
2. Workspace 仍然不是首页。
3. New Spark 输入默认收起，不占据首屏主体。
4. Feed item 不再直接显示 raw enum。
5. Feed item 不再默认显示 runtime number。
6. Feed item 使用自然语言解释为什么值得关注。
7. Feed item 至少支持：

   * pending Spark follow-up
   * repeated Sparks
   * related Sparks
   * evidence
   * relation
8. Node Detail 的 Messages 改为认知时间线。
9. Node Detail 能展示：

   * timeline
   * task panel
   * relation panel
   * evidence panel
   * stage progression
   * archive action
10. Workspace tabs 可用：

* Inbox
* Active
* Decision
* All

11. 移动端 390px 宽度可用。
12. 不修改数据库 schema。
13. 不新增后端 API。
14. 不破坏已有 Day 1 / Day 2 / Day 3 自检。
15. TypeScript check 通过。
16. 页面：

* /
* /workspace
* /nodes/[id]
  均返回 200。

---

# 20. Codex 实现要求

Codex 只能做前端 UX 重构。

允许修改：

* apps/web/src/app/*
* apps/web/src/components/*
* apps/web/src/api-client/*
* apps/web/src/app/globals.css
* 前端类型映射

除非编译必须，不要修改 backend。

禁止修改：

* apps/api/src/db/migrations/*
* apps/api/src/modules/*
* apps/api/src/services/*
* database schema

如果发现必须改后端才能实现某个展示，应先停止并说明原因，不要自行改架构。

---

# 21. 本轮不解决的问题

本轮不解决：

* Knowledge ingestion
* 文件上传
* RAG
* Radius1
* 更复杂的 Discovery
* Concept / Insight / Attention Pattern
* Outcome / Review
* 登录
* 云同步
* 多用户

这些进入后续版本讨论。
