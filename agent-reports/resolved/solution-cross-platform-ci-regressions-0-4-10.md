---
schema_version: 1
report_id: solution-cross-platform-ci-regressions-0-4-10
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T07:19:29Z
updated_at: 2026-07-13T07:19:29Z
depends_on:
  - issue-cross-platform-ci-regressions-0-4-10
related_files:
  - .gitattributes
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/scripts/build-mcp.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - Five complete Node 20.19 MCP smoke processes, each opening four concurrent clients, passed together.
  - CRLF-only bundle input passes freshness comparison while a semantic mutation still fails.
  - Build, typecheck, clean distribution, 14-tool registration, plugin validation and diff checks pass.
---

# 0.4.10 跨平台 CI 回归修复方案

## 负责 Agent

Development Agent, reviewed by Test Supervisor Agent.

## 对应问题

`agent-reports/resolved/issue-cross-platform-ci-regressions-0-4-10.md`

## Root Cause

Windows Git checkout converted the generated bundle to CRLF while the freshness check compared raw bytes against esbuild's LF output. On Linux, the daemon start lock became visible after `open("wx")` but before its JSON body was written; a contender parsed the fresh empty lock as missing, deleted it as stale and allowed multiple starters to replace each other's daemon state.

## 调研过程

- Re-ran the hosted workflow unchanged and reproduced the same Windows and Ubuntu failures.
- Verified Windows failed before build or distribution tests, while macOS and Ubuntu generated the same bundle size.
- Inspected the daemon lock publication and confirmed the empty-file window matched the concurrent token-specific timeout.
- Stress-tested the corrected single-flight path with 20 concurrent opens across five complete smoke suites.

## 可选方案

- Retry or skip the Linux test: rejected because it would conceal a real race.
- Reduce concurrency: rejected because normal concurrent MCP shims still require single-flight daemon ownership.
- Normalize all generated content: rejected; only CRLF/LF is normalized and semantic byte drift still fails.

## 推荐方案

Force LF for the generated bundle, compare freshness with line-ending normalization only, publish the lock in one closed `writeFile(..., { flag: "wx" })` operation, and give a fresh temporarily unreadable lock one second before stale cleanup. Keep token-guarded release and expose lifecycle-log tail on future concurrent failures.

## 实施步骤

1. Added the generated bundle LF attribute and line-ending-safe stale comparison.
2. Corrected lock ownership and fresh unreadable-lock handling.
3. Added concurrent failure lifecycle diagnostics.
4. Synchronized the runtime version to `0.4.10+codex.20260713151335`.

## 风险与回滚

An unreadable abandoned lock now waits one second before cleanup, trading a bounded recovery delay for correct concurrent ownership. Reverting the lock change would restore the Linux race.

## 处理结果

Local and stress verification pass; a new GitHub-hosted matrix run is still required after push.

## 修改文件

- `.gitattributes`
- MCP source/generated bundle, package version files and bundle builder.
- MCP smoke diagnostics.

## 验证方式

- Exact Node 20.19 full matrix command sequence.
- Five parallel full MCP smoke suites.
- CRLF-only and semantic-mutation bundle freshness fixtures.
- Plugin validator and `git diff --check`.

## 后续风险

Real Windows native fullscreen ready/control/Run acceptance remains a separate external gate.
