---
status: resolved
report_type: solution
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 21:52
updated_at: 2026-07-07 21:52
related_issue: agent-reports/resolved/20260707-2152-development-issue-mcp-stdio-transport-lifecycle.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/scripts/dev-server.mjs
---

# MCP stdio lifecycle hardening

## 负责 Agent

Development Agent, performed by main thread because the available multi-agent tool requires explicit user permission to spawn subagents.

## 对应问题

`agent-reports/resolved/20260707-2152-development-issue-mcp-stdio-transport-lifecycle.md`

## Root Cause

Canvasight's MCP stdio shim did not record lifecycle events, did not explicitly exit on stdin close, and could leave tool failures indistinguishable from host-side closed transports. The dev/server lifecycle also only cleaned state-pointed stale daemon processes.

## 调研过程

Direct JSON-RPC against the installed server succeeded, while the current Codex tool call returned `Transport closed`. After installing 0.1.44, the current thread still returned `Transport closed` and no lifecycle log appeared, confirming that the already-open thread was still using a closed host transport rather than launching the new shim.

## 可选方案

- Only update skills: rejected because it does not change runtime behavior.
- Restore browser fallback success: rejected because it violates the native widget Run contract.
- Harden stdio lifecycle and daemon cleanup: selected.

## 推荐方案

Keep the native widget contract, make stdio failures diagnosable, return JSON-RPC errors for tool failures, and clear stale daemon state before opening or dev recovery.

## 实施步骤

1. Add `mcp-lifecycle.log` events for stdio start, requests, request errors, stdin end, scheduled exit, signals, and process errors.
2. Track in-flight JSON-RPC calls and exit cleanly after stdin closes.
3. Return JSON-RPC errors for tool failures without closing stdout transport.
4. Stop stale state-pointed daemons and old cache-version daemon processes.
5. Add lifecycle/content-length/unknown-tool smoke coverage.
6. Bump plugin version to `0.1.44`, reinstall, and refresh dev server.

## 风险与回滚

Reload/new-thread is still required when the current Codex thread already holds a closed transport. Rollback is the previous commit, but it would remove lifecycle evidence and stale cleanup.

## 处理结果

已修复运行时可诊断性和 stale cleanup；当前线程热替换限制已记录为残余风险。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/scripts/dev-server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `README.md`
- `AGENTS.md`
- `design.md`
- Canvasight skills

## 验证方式

- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run test:markdown`
- `npm run typecheck`
- `npm run build`
- plugin validator
- install/list/dev status checks

## 后续风险

Codex Desktop may keep a closed transport for the current already-open thread. Native widget verification must be performed after reload or in a new thread using 0.1.44.
