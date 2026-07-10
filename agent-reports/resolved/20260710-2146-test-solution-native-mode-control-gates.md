---
status: resolved
report_type: solution
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
created_at: 2026-07-10 21:46
updated_at: 2026-07-10 21:46
related_issue: null
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Native Plan/Goal 模式控制回归门

## 负责 Agent

Test Supervisor Agent

## 对应问题

用户实测表明 Canvasight 的独立 app-server 模式请求成功并不代表当前 Desktop widget 已进入 Plan 或 Goal 模式。

## Root Cause

原 smoke 将独立 app-server 的成功响应当作 widget host 状态证据，并允许桥接继续发送 Markdown。

## 推荐方案

在 widget 预处理和前端 bridge 两层验证：缺少宿主原生模式切换/确认能力时，Plan/Goal 返回专用 unavailable code 且不得发送；Chat 保持已验证 bridge 发送路径。

## 处理结果

- MCP smoke 断言 widget Plan/Goal 返回 `native_plan_mode_control_unavailable` / `native_goal_mode_control_unavailable`，且没有独立 app-server RPC。
- 动态 widget API smoke 模拟 host prepare 拒绝，确认 Plan/Goal 零 bridge `sendFollowUpMessage`；Chat 成功 prepared 后发送一次。
- 保留 Chat preflight、degraded Chat 与普通 await 路径覆盖。

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run test:mcp` 通过。
- `git diff --check` 通过。

## 后续风险

真实 Desktop host 若未来公开受支持的 Plan/Goal 控制与确认 API，需补充该能力的正向 native-host 验收后才能解除阻断。
