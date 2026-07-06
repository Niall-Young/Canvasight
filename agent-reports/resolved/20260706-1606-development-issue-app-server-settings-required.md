---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 16:06
updated_at: 2026-07-06 16:12
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
solution_report: agent-reports/resolved/20260706-1612-development-solution-app-server-settings-required.md
---

# Codex app-server 要求 collaborationMode.settings 字段

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent, Test Supervisor Agent

## 问题描述

修复 null 字段后，真实点击 Canvasight Run 仍未发送。daemon fallback payload 显示新错误：`Invalid request: missing field \`settings\``。

## 复现方式

1. 打开 `http://127.0.0.1:5173/`。
2. 点击有内容节点的 Run。
3. 当前 Codex thread 未收到消息。
4. 调 `/api/runs/await` 可取到 queued payload，`codexNative.status=failed`。

## 影响范围

- Chat/default 模式的 `thread/settings/update`。
- 真实点击 Run direct delivery。
- MCP/dev-server smoke 对真实 app-server schema 的覆盖。

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`

## 证据

真实 payload 中：

- `codexNative.status`: `failed`
- `codexNative.error`: `Invalid request: missing field \`settings\``
- `codexTurn.status`: `skipped`
- `delivery.status`: `queued`

## 初步归因

上一轮为了避免 null 字段，将 Chat/default 模式的 `collaborationMode` 改成 `{ mode: "default" }`。真实 Codex app-server 需要 `settings` 字段存在，但字段内部不能包含 null。

## 期望结果

- Chat/default: `{ mode: "default", settings: {} }`
- Plan: `{ mode: "plan", settings: { reasoning_effort: "medium" } }`
- fake app-server 对 `thread/settings/update` 缺少 `settings` 的请求直接失败。

## 当前状态

resolved

## 处理结果

已修复。`codexCollaborationMode()` 现在始终返回 `settings` 字段，Chat/default 为 `{}`，Plan 为 `{ reasoning_effort: "medium" }`，同时继续避免 null 可选字段。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `agent-reports/QUEUE.md`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`

## 后续风险

- 需要重启 dev server/daemon 并重新安装 `canvasight@canvasight-local` 到 `0.1.21` 后，当前网页才会跑新 runtime。
