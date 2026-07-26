---
schema_version: 1
report_id: issue-codex-react-185-sidebar-recovery
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: critical
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-26T03:21:10Z
updated_at: 2026-07-26T03:32:20Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: failed
verification_evidence:
  - v0.4.35 focused widget runtime fixture deterministically mounts three simultaneous zero-size historical Widgets and fails with aggregate inline presentation requests 3 instead of the required 1.
  - The minimized red signal completes in about 12.5 seconds and does not need the real 30-second delayed host crash.
  - An isolated temp-copy combined build passes the repaired widget runtime and MCP smoke without mutating shared generated artifacts.
solution_report:
---

# Codex 历史 Canvasight 侧栏恢复触发 React #185

## TL;DR

Canvasight 0.4.35 必须保留任务往返后的自动侧栏恢复，同时确保同一项目与 Codex 任务只有一个当前 Widget 能执行有界 presentation pulse，避免历史 Widget 竞争导致宿主更新循环。

## 发现者

GitHub Issue #2（smartLanny）

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

打开包含 Canvasight graph/widget 历史的本地 Codex 任务后，任务可能先正常渲染，约 30 秒后进入 Codex Desktop 通用错误页。日志报告 React #185 / Maximum update depth exceeded，任务数据仍可读取。

## 现象

- 历史任务及其同目录 fork 都会在加载后复现宿主错误。
- 错误前出现重复 browser-sidebar ownership 同步与 Canvasight resource/tool 调用。
- 0.4.34 已验证的任务 A→B→A 自动恢复不能回滚为手工折叠/重开侧栏。

## 复现方式

1. 在 exact 0.4.35 打开包含多个 Canvasight 历史 Widget 的本地任务。
2. 保持任务可见并观察至少 60 秒。
3. 记录 presentation 请求、Widget identity、sidebar ownership 相关宿主错误与 React #185。

## 影响范围

Codex Desktop 原生 Widget 历史重放、任务往返恢复、侧栏 presentation ownership；不涉及 `.scatter` 数据、附件、Run 内容或项目源文件。

## 证据

- GitHub Issue #2 报告 Codex Desktop 26.715.61943、Canvasight 0.4.35、React #185。
- 0.4.34 的单 binding `F,F,F,I,F` 恢复曾通过三轮真实任务往返。
- 0.4.21 已限制历史 Widget revision polling，但 presentation pulse 尚无 project+thread 唯一协调者。

## 初步归因

红色反馈环已确认多个历史 Widget 会各自执行一次 `F,F,F,I,F`，使同一任务出现三个 inline presentation 请求。单 Widget 不会暴露跨实例竞争，三个并发零尺寸实例是当前最小代表性场景。

## 交付给哪个 Agent

Development Agent 实现协调逻辑；Test Supervisor Agent建立并验证红色回归；Project Management Agent在验证后完成选择性 Git 闭环。

## 需要回答的问题

- React #185 前是否存在超过一个 presentation pulse owner？
- project+thread 唯一协调和短时防重是否能消除循环且保留 A→B→A 自动恢复？
- 若仅一个 pulse 仍触发 React #185，是否应停止插件侧发布并归为宿主缺陷？

## 相关文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

任务往返后 Canvasight 自动显示；同一项目与任务最多一个当前 Widget 执行一次有界恢复；历史任务及 fork 不发生 React #185 或通用错误页。

## Closure Criteria

- [x] 红色反馈环捕获重复侧栏恢复竞争
- [ ] 根因明确并写入 solution report
- [ ] A→B→A 自动恢复无回归
- [ ] 历史任务 60 秒稳定性通过
- [ ] 修改文件、验证方式与后续风险已记录

## 当前状态

assigned。红色反馈环和 source 修复已完成，隔离环境的 widget runtime/MCP smoke 已转绿。并发富文本任务正在修改共享 package/report/dist 路径；版本、共享产物、原生验收、队列与 Git 闭环需在范围可安全分离后完成。

## 处理结果

已增加 project+thread presentation recovery coordinator。只有最新 open attempt 的唯一 owner 可执行模式脉冲；peer、旧 binding 与冷却期实例保持被动等待。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- 本 issue report

## 验证方式

- RED：v0.4.35 `npm run test:widget-runtime`，三历史 Widget inline 请求为 3，期望 1。
- GREEN：隔离 temp-copy `npm run build`、`npm run test:widget-runtime`、`npm run test:mcp`。

## 后续风险

- 原生 Codex host 是唯一能证明 React #185 消失的验收面。
- 不能用取消自动恢复来规避崩溃，否则会重新引入已修复的任务往返白屏。
