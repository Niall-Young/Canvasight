---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-10 21:46
updated_at: 2026-07-10 21:46
related_issue: user-reported-native-plan-mode-false-positive
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Native Plan/Goal 模式确认门

## 负责 Agent

Development Agent

## 对应问题

用户现场确认：Canvasight 显示 Plan 已应用并发送 Markdown，但当前 Codex task 实际仍不是 Plan mode。

## Root Cause

Widget 预备流程把独立 app-server 的 `thread/settings/update` 和 `thread/goal/set` 成功当作 widget 所属 task 的原生 Plan/Goal 模式已确认。现有 widget host bridge 仅公开 follow-up message 投递，没有可用的模式切换或确认 API。

## 推荐方案

在所有 Canvasight Run 路径直接阻断 Plan 与 Goal；只在未来宿主提供可调用且可确认的原生模式控制 API 后，才接入该 API 并允许发送。Chat 保持现有桥接投递和 preflight 行为。

## 处理结果

- Plan 现在返回 `native_plan_mode_control_unavailable`，Goal 返回 `native_goal_mode_control_unavailable`；两者都在 `sendMessage` 前阻断，并且 browser/await 不会再伪报已应用。
- Plan/Goal 不再调用独立 app-server 的模式/目标更新，也不会返回 `applied_plan` 或 `applied_goal`。
- 前端 Run 类型显式覆盖两种阻断错误码。
- MCP smoke 覆盖 widget、browser/await、当前 thread 与 task-not-loaded 的 Plan/Goal 情形，确认没有外部设置调用；Chat 流程保持覆盖。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run test:mcp` 通过。

## 后续风险

当前 Codex widget host 未暴露模式控制 API，因此 native widget 不支持 Plan/Goal Run；这是一项明确阻断而非降级发送。待宿主 API 可用后，需要用真实 Desktop host 验证切换确认和同 task 投递。
