---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-06 16:26
updated_at: 2026-07-06 16:26
related_issue: agent-reports/resolved/20260706-1618-development-issue-chat-settings-update-model-required.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
---

# Chat Run 跳过 settings update 的解决方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1618-development-issue-chat-settings-update-model-required.md`

## Root Cause

Chat Run 不需要切换 Codex collaboration mode，但旧实现仍把 Chat 映射到 `thread/settings/update(default)`。真实 Codex app-server 对 settings update 需要更完整的 settings schema，包括 `model`，因此请求在 `turn/start` 前失败。

## 调研过程

- 用户复现点击运行后左侧当前线程没有收到 Canvasight Markdown。
- 读取 daemon 待处理运行 payload，确认早前失败点从 `missing settings` 变成真实 app-server 的 `missing model`。
- 手动向真实 Codex app-server 发送 `thread/settings/update`，复现 `Invalid request: missing field model`。
- 复核 MCP 运行时发现 Chat 也会调用 `setCodexCollaborationMode(default)`。
- 与 Development Agent 和 Test Supervisor Agent 交接后确认 Chat 应直接 `turn/start`，不改线程 settings。

## 可选方案

- 方案 A：给 `thread/settings/update` 补 `model`。副作用是 Canvasight 需要知道并修改用户当前线程模型设置，风险高。
- 方案 B：Chat 模式跳过 native settings update，仅把 native apply 视作无需操作，然后继续 `turn/start`。
- 方案 C：所有模式都退回 `await_canvasight_run` 队列。会丢失用户要求的直接发送体验。

## 推荐方案

采用方案 B。Chat 的语义是“把当前画布生成的 Markdown 发送到当前线程”，不需要修改 Plan、Goal 或模型设置。

## 实施步骤

1. 在 `applyCodexNativeMode()` 中让 `codexMode === "chat"` 直接返回 `action: "chat/no-settings-update"`。
2. 移除 Goal 路径中紧随 `thread/goal/set` 的 default settings reset，避免同类 schema 错误。
3. 将插件版本提升到 `0.1.22`。
4. 更新 MCP 和 dev-server smoke test，断言 Chat 不调用 `thread/settings/update` 或 `thread/goal/set`，且只调用一次 `turn/start`。
5. 重新安装本地插件缓存并确认 dev server 仍运行在 `http://127.0.0.1:5173/`。

## 风险与回滚

风险：Plan 模式仍依赖 `thread/settings/update`，真实 app-server 可能也要求完整 settings。回滚方式是恢复 `0.1.21` 提交或让 Chat 临时走 `await_canvasight_run` 队列。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list | grep 'canvasight@canvasight-local'`
- `npm run dev:status`

## 后续风险

需要单独验证 Plan 模式在真实 app-server 下是否也被 `model` schema 拦截；本轮修复范围只覆盖用户当前失败的 Chat 点击发送路径。
