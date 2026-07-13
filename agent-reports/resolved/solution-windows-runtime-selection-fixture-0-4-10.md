---
schema_version: 1
report_id: solution-windows-runtime-selection-fixture-0-4-10
report_type: solution
status: resolved
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
version: 1
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-13T07:30:50Z
updated_at: 2026-07-13T07:30:50Z
depends_on:
  - issue-windows-runtime-selection-fixture-0-4-10
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - Exact Node 20.19 syntax, full MCP smoke, bundle and clean 14-tool distribution checks pass.
  - Development review confirms production runtime and selection/no-fallback assertions are unchanged.
---

# Windows runtime selection 测试夹具方案

## 负责 Agent

Test Supervisor Agent, reviewed by Development Agent.

## 对应问题

`agent-reports/resolved/issue-windows-runtime-selection-fixture-0-4-10.md`

## Root Cause

The smoke fixture treated a chmod'd shebang `.mjs` file as a cross-platform executable and used `:` as the PATH separator. Windows could not spawn the fake app-server, so the production project resolver correctly returned `current_thread_project_unavailable`.

## 调研过程

- Confirmed Windows had already passed the self-contained distribution and exactly 14 tool registration gates.
- Located the failure before the main smoke sequence in the explicit runtime candidate.
- Audited all main, newline, Content-Length and runtime-selection fake app-server paths for the same Unix assumption.

## 可选方案

- Skip runtime selection on Windows: rejected because it would weaken cross-platform coverage.
- Change production spawn behavior: rejected because production receives a real Windows executable; the defect was in the fixture.

## 推荐方案

Keep the generated fake app-server as a script, use real copied `node.exe` candidates on Windows, pass the script through `CANVASIGHT_CODEX_APP_SERVER_ARGS`, record `process.execPath` for candidate assertions and use `path.delimiter`.

## 实施步骤

1. Separated fake script path from fake executable path.
2. Routed every Windows fake runtime client through `node.exe <fake-script>`.
3. Kept five distinct executable candidates for explicit/Desktop/ChatGPT/PATH/no-fallback assertions.
4. Preserved existing POSIX shebang behavior.

## 风险与回滚

Test-only change; production runtime, bundle and version are untouched. Reverting would restore the Windows false failure.

## 处理结果

Local exact-Node gates pass; hosted Windows confirmation remains required after push.

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `node --check tests/mcp-smoke.mjs`
- `npm run test:mcp`
- `npm run check:mcp-bundle`
- `npm run test:plugin-distribution`

## 后续风险

Real Windows native fullscreen ready/control/Run acceptance remains separate from this automated fixture.
