---
status: resolved
report_type: solution
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
created_at: 2026-07-10 19:59
updated_at: 2026-07-10 19:59
related_issue: agent-reports/resolved/20260710-1933-test-issue-plan-goal-thread-store-run-block.md
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Desktop Proxy Plan / Goal 回归门禁

## 负责 Agent

Test Supervisor Agent

## 对应问题

`agent-reports/resolved/20260710-1933-test-issue-plan-goal-thread-store-run-block.md`

## Root Cause

原有 smoke 只覆盖独立 stdio app-server，无法验证 Desktop proxy 优先级、proxy 不可用时的受限回退，或损坏旧 task 与新 widget task 的隔离。

## 推荐方案

用同一 JSON-RPC fake Codex 模拟 `app-server proxy` 的 stdio 表面：socket 标记使 auto 模式选中 proxy，启动前退出模拟 proxy 不可用。对 Plan/Goal 的实际 RPC log 断言 task id。

## 处理结果

- Plan 与 Goal 成功路径断言 `codexNative.transport === "desktop_proxy"`。
- proxy 启动不可用时，Plan 仅回退到 `stdio_fallback`，且只 resume/update 当前 widget task。
- 损坏 `thread-old-broken` 后重新以 `thread-current-widget` 打开同一项目；Plan 只触碰 current task，绝不 resume 旧 task。

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run test:mcp` 通过。
- `git diff --check` 通过。

## 后续风险

该 smoke 证明协议选择、回退边界和 task 绑定；无法替代重启 Codex Desktop 后的真实 native widget Plan/Goal + host bridge 验收。
