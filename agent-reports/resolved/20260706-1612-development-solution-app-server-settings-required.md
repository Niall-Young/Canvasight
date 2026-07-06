---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-06 16:12
updated_at: 2026-07-06 16:12
related_issue: agent-reports/resolved/20260706-1606-development-issue-app-server-settings-required.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
---

# 补齐 Codex collaborationMode.settings

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1606-development-issue-app-server-settings-required.md`

## Root Cause

上一轮修复移除了 `thread/settings/update` 的 null 可选字段，但 Chat/default 模式下把 `settings` 字段整体省略成 `{ mode: "default" }`。真实 Codex app-server schema 要求 `collaborationMode.settings` 存在，因此返回 `Invalid request: missing field \`settings\``。

## 调研过程

- 从 daemon fallback queue 读取用户真实点击 Run 后的 payload。
- 确认 `codexNative.status=failed`，错误为 `Invalid request: missing field \`settings\``。
- Development Agent 确认 default/chat 应发送 `{ mode: "default", settings: {} }`。
- Test Supervisor Agent 要求 fake app-server 必须同时拒绝 null 和缺少 settings，并在 native log 中断言 default/plan settings。

## 可选方案

- 方案 A：继续省略 default settings，依赖 fallback queue。不能修复 direct delivery，拒绝。
- 方案 B：传回 null settings 字段。会恢复上一轮真实 schema 错误，拒绝。
- 方案 C：始终发送 `settings` 对象，内部只放有值字段。采用。

## 推荐方案

采用方案 C：

- Chat/default: `{ mode: "default", settings: {} }`
- Plan: `{ mode: "plan", settings: { reasoning_effort: "medium" } }`
- Goal reset default 同样使用 `{ mode: "default", settings: {} }`

## 实施步骤

1. 修改 `codexCollaborationMode()`，始终返回 `settings` 对象。
2. fake app-server 对 `thread/settings/update` 缺少 `settings` 的请求返回 error。
3. MCP smoke 增加 default/plan settings 断言。
4. dev-server smoke 增加 default settings 断言。
5. bump 插件版本到 `0.1.21`。

## 风险与回滚

- 风险：真实 app-server schema 未来变化时需要再次适配；当前实现基于真实错误反馈。
- 回滚：降回 `0.1.20` 会恢复 `missing field settings`。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260706-1606-development-issue-app-server-settings-required.md`
- `agent-reports/resolved/20260706-1612-integration-summary-app-server-settings-required.md`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`

## 后续风险

- 用户已经失败的那次 queued payload 已被诊断读取，不会自动继续执行；更新服务后需要重新点击 Run。
