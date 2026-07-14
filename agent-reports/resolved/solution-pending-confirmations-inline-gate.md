---
schema_version: 1
report_id: solution-pending-confirmations-inline-gate
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T06:22:20Z
updated_at: 2026-07-14T06:22:20Z
depends_on:
  - issue-pending-confirmations-bypass-inline-gate
related_files:
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/tests/skills-smoke.mjs
  - AGENTS.md
verification_status: passed
verification_evidence:
  - npm run test:skills passed on Canvasight 0.4.18 working state.
  - Graph Writer Skill quick_validate.py returned Skill is valid.
---

# 修复待确认事项绕过 inline 门禁

## 负责 Agent

Development Agent；Product Agent 与 Test Supervisor Agent 分别完成边界和前向测试审查。

## 对应问题

`agent-reports/resolved/issue-pending-confirmations-bypass-inline-gate.md`

## Root Cause

旧合同给出了调用确认工具的条件，但没有把“准备输出待确认项”定义为写图前不可绕过的 invariant。探索型 references 又允许 question nodes，模型因此可能先写图再列出会改变框架的未决事项。

## 推荐方案

在任何写图前强制将未决项分类为 `blocking-framework` 或 `non-blocking-backlog`。前者必须先调用 inline 工具并停止；后者仅限用户要求的探索对象、不会改变本轮结构的后续研究或不改变结构与验收的装饰偏好。

## 处理结果

- 身份/权威、主要受众、内容与媒体类型、语言覆盖、范围、关键关系、写入方式、必要覆盖和验收均纳入 blocking 判断。
- 禁止先写图、先声称完成或把未回答 blocker 放入“待确认/Open questions”节点。
- 一张卡最多三题不再是遗留其他 blocker 的许可；必要时答案后继续下一批。
- 保留仓库、Page、上下文和 Skill 可推断事实先自查，以及明确非阻塞 backlog 的例外。

## 修改文件

- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`
- `plugins/canvasight/tests/skills-smoke.mjs`
- `AGENTS.md`

## 验证方式

- `npm run test:skills`
- Graph Writer Skill `quick_validate.py`

## 后续风险

Skill 行为依赖新任务加载更新后的插件快照；已经生成的旧回复不会被追溯改写。原 inline UI native-host 验收由既有 blocked issue 继续跟踪。
