---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-10 19:37
updated_at: 2026-07-10 19:37
related_issue: agent-reports/resolved/20260710-1933-test-issue-plan-goal-thread-store-run-block.md
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Plan / Goal thread-store 阻断的恢复反馈

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260710-1933-test-issue-plan-goal-thread-store-run-block.md`

## Root Cause

当前 Codex task 的 rollout metadata 无法由 thread-store 读取，导致 Plan 的 `thread/settings/update` 与 Goal 的 `thread/goal/set` 都不能在正确 task 上执行。

## 推荐方案

不放宽 Plan/Goal 的模式预检。仅 Chat 可以在精确的预检错误下依靠已验证 bridge 降级；Plan/Goal 则显示重载/重启、新 task、重开画布的恢复说明，并保留原始诊断。

## 处理结果

- App 对 Plan/Goal 的可识别 thread-store 预检错误显示本地化恢复提示。
- 原始错误串保留在提示中，便于诊断。
- MCP smoke 新增 Goal 的四次 resume 失败断言，确认不调用 `thread/goal/set`。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run typecheck && npm run test:mcp`
- `npm run build`
- plugin validator

## 后续风险

若 Codex task 本身持续损坏，恢复动作必须在新的 task 中完成；Canvasight 不应修改 Codex session 文件。
