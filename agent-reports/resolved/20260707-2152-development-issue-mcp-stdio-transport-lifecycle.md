---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 21:52
updated_at: 2026-07-07 21:52
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/scripts/dev-server.mjs
solution_report: agent-reports/resolved/20260707-2152-development-solution-mcp-stdio-transport-lifecycle.md
---

# Canvasight MCP stdio transport lifecycle is opaque

## TL;DR

Visible Canvasight tools can fail with `Transport closed` without any plugin-side lifecycle evidence, leaving native widget open failures indistinguishable from Codex host transport reuse.

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

The current thread could lazy-load Canvasight tool descriptors, but calling a lightweight tool returned `Transport closed`. Direct JSON-RPC against the installed server worked, so the missing piece was a durable, diagnosable stdio shim lifecycle and stale daemon cleanup.

## 现象

- `tool_search` exposed `open_canvasight` and related tools.
- `list_canvasight_recent_projects` returned `Transport closed`.
- No `mcp-lifecycle.log` was written in the current thread, proving the current call path did not start the new shim.
- Dev state also contained stale cross-version daemon records.

## 复现方式

1. Install Canvasight 0.1.43 or older in an already-open Codex thread.
2. Use `tool_search` to expose Canvasight tools.
3. Call `list_canvasight_recent_projects` or `open_canvasight`.

## 影响范围

Normal native widget opening and queued Run recovery can be blocked before Canvasight runtime code executes. Browser fallback must not be used as a fake success path.

## 证据

- Current-thread tool call returned `Transport closed`.
- Direct server JSON-RPC smoke passed.
- `npm run dev:status` found stale dev and daemon versions before cleanup.

## 初步归因

The stdio MCP shim lacked lifecycle logging, clean stdin-end handling, and enough stale daemon cleanup to separate host-side closed transports from plugin-side tool failures.

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- Can tool failures return JSON-RPC errors without closing transport?
- Can stale daemon state be cleaned during open/dev recovery?
- Can current-thread closed transports be distinguished from new 0.1.44 shims?

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/scripts/dev-server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`

## 期望结果

New/reloaded Codex threads run Canvasight 0.1.44 MCP shims with lifecycle logs, clean stdin shutdown, JSON-RPC tool errors, and stale daemon cleanup.

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

Implemented 0.1.44 MCP stdio lifecycle hardening and daemon stale cleanup. Current already-open Codex thread can still hold a closed old transport, so final native widget verification must be done from a new or reloaded thread.

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/scripts/dev-server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- Documentation and skill files

## 验证方式

- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run test:markdown`
- `npm run typecheck`
- `npm run build`
- plugin validator
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`
- `npm run dev && npm run dev:status`

## 后续风险

Already-open Codex threads may keep a closed MCP transport and will not hot-swap to the new 0.1.44 shim. They need reload/new-thread for real native tool invocation.
