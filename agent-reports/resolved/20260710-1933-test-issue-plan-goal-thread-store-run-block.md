---
status: resolved
report_type: issue
owner: Development Agent
created_by: Test Supervisor Agent
priority: critical
created_at: 2026-07-10 19:33
updated_at: 2026-07-10 19:37
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260710-1937-development-solution-plan-goal-thread-store-recovery.md
---

# Plan / Goal Run 被持续 thread-store 读取错误阻断

## TL;DR

Plan/Goal 必须先由 Codex 写入协作模式或目标；任务 rollout 无法读取时不可安全地降级成 Chat 发送。本轮保留阻断，并提供可操作恢复提示和两种模式的回归测试。

## 发现者

用户现场反馈；Test Supervisor Agent 复核。

## 提交 Agent

Test Supervisor Agent

## 建议交接 Agent

Development Agent

## 问题描述

当前 Codex task 的 rollout 不能被 thread-store 读取时，Plan 或 Goal Run 在调用 widget host `sendMessage` 前失败。Chat 已有精确降级，但它不能用于需要确认模式或目标已写入的 Plan/Goal。

## 现象

- Plan 与 Goal 均在四次 `thread/resume` 失败后阻断。
- Run 状态此前直接展示底层 502 与本地 rollout 路径，缺少恢复动作。

## 复现方式

1. 让 fake Codex 对 threadId 的每一次 `thread/resume` 返回 session metadata 错误。
2. 从 verified fullscreen widget 发起 Plan 或 Goal Run。
3. 观察发送前阻断。

## 影响范围

当前 Codex task 存在持续 thread-store/rollout metadata 读取错误的 Plan/Goal native Run。

## 证据

- `applyWidgetCodexMode` 只对 Chat 使用明确的预检降级。
- `setCodexCollaborationMode` 与 `setCodexGoal` 都需要先 resume 当前 task。
- MCP smoke 现覆盖 Plan 和 Goal 的四次失败且无状态写入。

## 初步归因

Codex 无法读取当前任务本地 session metadata，因而无法安全执行 `thread/settings/update` 或 `thread/goal/set`。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- Plan/Goal 是否可在未应用模式或目标时桥接发送？结论：不可，避免假成功。
- 用户如何恢复？重载或重启 Codex Desktop，新建 task，重新打开 Canvasight 后重试。

## 相关文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

保留真实 Plan/Goal 语义，给出明确恢复路径，并覆盖两种模式。

## Closure Criteria

- [x] Plan/Goal 的安全语义经过开发确认
- [x] 覆盖 Plan 和 Goal 的持久 thread-store 回归测试
- [x] 前端状态不伪造 mode/goal 已应用
- [x] MCP、typecheck、build 与插件校验已记录
- [x] 解决方案报告、队列与集成摘要已回写

## 当前状态

resolved

## 处理结果

保留发送前阻断；前端显示本地化恢复步骤并保留完整诊断。Goal 增加与 Plan 同等的持续失败回归覆盖。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- plugin validator

## 后续风险

真实 Codex task 的 thread-store 损坏不能由 Canvasight 修复；native-host 实机验收未在本轮执行。
