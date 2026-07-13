---
schema_version: 1
report_id: issue-cross-platform-ci-regressions-0-4-10
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T07:12:23Z
updated_at: 2026-07-13T07:19:29Z
depends_on:
  - issue-mcp-distribution-missing-dependencies
related_files:
  - plugins/canvasight/scripts/build-mcp.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - .github/workflows/canvasight-plugin.yml
verification_status: passed
verification_evidence:
  - Five parallel full Node 20.19 MCP smoke suites completed 20 concurrent opens successfully.
  - CRLF bundle freshness and semantic-mutation fixtures prove only line-ending drift is ignored.
  - Build, typecheck, clean distribution, 14-tool registration and plugin validation pass.
solution_report: solution-cross-platform-ci-regressions-0-4-10
---

# 0.4.10 跨平台 CI 回归

## TL;DR

The first hosted OS matrix exposed a Windows bundle-comparison mismatch and a Linux concurrent-daemon startup timeout that must be corrected before the packaging release is considered cross-platform verified.

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent, reviewed by Test Supervisor Agent.

## 问题描述

The committed self-contained entry passes local macOS verification, but the first hosted matrix did not complete successfully on Windows and Linux.

## 现象

- Windows fails `npm run check:mcp-bundle` immediately after a clean checkout and `npm ci`.
- Ubuntu passes bundle, build, clean-distribution and 14-tool registration checks, then times out during the four-client daemon single-flight smoke.

## 复现方式

1. Inspect GitHub Actions run `29231086018` for commit `77e257d5faf66b24d29fe64f9e559a8c13416cb2`.
2. On Windows, run `npm ci` then `npm run check:mcp-bundle`.
3. On Ubuntu, run the full workflow through `npm run test:mcp`.

## 影响范围

Cross-platform release verification and confidence in clean Windows/Linux installations.

## 证据

- macOS job passed.
- Windows stale-bundle message is consistent with checkout line-ending or generator determinism drift.
- Ubuntu distribution and registration gates passed before the concurrent runtime smoke timed out.

## 初步归因

Windows compared CRLF checkout bytes with LF generator output. Linux exposed an empty start-lock publication race that allowed multiple owners to spawn and replace each other's daemon.

## 交付给哪个 Agent

Development Agent owns the fix; Test Supervisor Agent owns hosted-matrix evidence.

## 需要回答的问题

- Is the generated MCP entry byte- or text-deterministic across Windows, macOS and Linux?
- Does the Linux single-flight test pass reliably without weakening the clean-install or 14-tool gates?

## 相关文件

- `plugins/canvasight/scripts/build-mcp.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `.github/workflows/canvasight-plugin.yml`

## 期望结果

The hosted Windows, macOS and Linux jobs all pass the committed bundle, clean-distribution, 14-tool registration and runtime checks.

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

Windows bundle checks now tolerate line-ending conversion only, and daemon startup has single-flight protection across the previously empty lock window.

## 修改文件

- `.gitattributes`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/scripts/build-mcp.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- Synchronized package version files.

## 验证方式

- Five full MCP suites in parallel on exact Node 20.19, plus build, distribution, 14-tool registration, plugin validation and CRLF/content-drift fixtures.

## 后续风险

The corrective commit still requires a fresh hosted Windows/macOS/Linux run. Real Windows Codex native-host acceptance remains separate.
