---
schema_version: 1
report_id: issue-pending-confirmations-bypass-inline-gate
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T06:18:45Z
updated_at: 2026-07-14T06:22:20Z
depends_on:
  - issue-inline-framework-questions
related_files:
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/tests/skills-smoke.mjs
  - AGENTS.md
verification_status: passed
verification_evidence:
  - Graph Writer Skill now classifies every unresolved item before any graph write and forbids writing or claiming completion while a blocking-framework item remains.
  - Skill smoke and skill-creator quick validation passed.
solution_report: agent-reports/resolved/solution-pending-confirmations-inline-gate.md
---

# 待确认事项绕过消息内确认门禁

## TL;DR

Graph Writer 已识别出身份定位、主要访客、照片使用、作品图灰度、文章与双语需求等待确认事项，却直接完成写图并把它们列在结果里，没有调用 `ask_canvasight_framework_questions`。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

现有 Skill 把 inline 提问写成“至少两个合理答案会实质改变框架时调用”的判断项，但没有禁止模型先写图、再把同类决策标成“待确认”“待定”或 TBD。于是模型能识别歧义，却绕过确认工具。

## 现象

- 输出明确说“当前待确认项也单独列出”。
- 五项均会改变内容、受众、媒体或语言策略。
- 当前任务已经能发现 `ask_canvasight_framework_questions`，不是工具缺失。

## 复现方式

让 Graph Writer 为资料不足的个人作品集梳理框架；观察它是否先写图，并在完成说明或节点中列出身份定位、受众、照片、作品图风格或双语等未决事项。

## 影响范围

Graph Writer Skill 的确认门禁、Skill 回归测试和项目工作合同。

## 期望结果

只要模型准备把会改变框架的事项写成“待确认/待定/TBD/open question”，就必须在任何写图调用前聚合成一至三道 inline 问题并停止当前写图回合；除非用户明确要求把开放问题保留在画布中。

## 当前状态

resolved

## 处理结果

Graph Writer 现在会在写图前强制区分 blocking-framework 与 non-blocking-backlog；会改变框架的待确认项必须先进入消息内确认工具并停止写图。

## 修改文件

- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`
- `plugins/canvasight/tests/skills-smoke.mjs`
- `AGENTS.md`

## 验证方式

- `npm run test:skills`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-graph-writer`

## 后续风险

原消息内组件的 native-host 验收仍由独立 `issue-inline-framework-questions` 跟踪；本 issue 只关闭 Graph Writer 绕过调用的 Skill 合同缺陷。
