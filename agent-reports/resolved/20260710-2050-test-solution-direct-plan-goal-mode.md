---
status: resolved
report_type: solution
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
created_at: 2026-07-10 20:50
updated_at: 2026-07-10 20:50
related_issue: agent-reports/resolved/20260710-1933-test-issue-plan-goal-thread-store-run-block.md
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Direct Plan / Goal Mode Regression Gates

## 负责 Agent

Test Supervisor Agent

## 对应问题

`agent-reports/resolved/20260710-1933-test-issue-plan-goal-thread-store-run-block.md`

## Root Cause

原 smoke 将 Plan/Goal 的 `thread/resume` 作为成功路径前提，不能验证直接设置模式，也无法区分真正的 task 未加载与损坏 rollout。

## 推荐方案

扩展 fake Codex，使其可独立返回直接成功、`thread not loaded` 与 `failed to read thread`，并按每次 Run 的 RPC 日志验证调用顺序。

## 处理结果

- Plan/Goal 的直接成功路径断言不调用 `thread/resume`。
- 仅 `thread not loaded` 允许一次 `resume` 后重试 Plan/Goal；Plan 断言使用 resume 返回的模型。
- `failed to read thread` 时 Plan/Goal 保持失败，且绝不 resume。
- 保留 Chat 的 resume 重试及 thread-store 降级回归覆盖。

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run test:mcp` 通过。
- `npm run typecheck` 通过。
- `git diff --check` 通过。

## 后续风险

Smoke 只能验证 RPC 合同，无法代替重启 Codex Desktop 后在真实 native widget 中点击 Plan/Goal 的验收。
