---
schema_version: 1
report_id: issue-mcp-distribution-missing-dependencies
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T06:54:28Z
updated_at: 2026-07-13T07:02:28Z
depends_on:
  - issue-windows-mcp-registration-diagnostics
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/plugin-distribution-smoke.mjs
  - .github/workflows/canvasight-plugin.yml
verification_status: passed
verification_evidence:
  - Clean copied plugin without node_modules completes registration with exactly 14 tools.
  - Exact installed 0.4.10 cache passes the same probe while its node_modules directory is absent.
  - MCP smoke, build, plugin validation and diff check pass.
solution_report: solution-mcp-distribution-self-contained
---

# GitHub 安装的 MCP 缺少运行时依赖

## TL;DR

Canvasight `0.4.10+codex.20260713145428` ships a self-contained MCP entry and no longer requires `node_modules` in Git-backed installed snapshots.

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

The previous MCP entry imported runtime packages that were absent from clean Git installations. The generated installed entry now bundles those packages while preserving `.mcp.json`, all 14 tool APIs, plugin-root resolution and daemon self-spawn.

## 现象

- Previous clean installs exited with `ERR_MODULE_NOT_FOUND` before tool registration.
- The fixed clean distribution completes `initialize` and `tools/list` without any dependency directory.

## 复现方式

1. Copy the plugin while excluding `node_modules` and caches.
2. Run the installed registration probe.
3. Confirm all 14 tools and required open tools are present.

## 影响范围

Git-backed Canvasight installs on Windows, macOS and Linux.

## 证据

- Clean distribution smoke passed.
- Exact installed-cache probe passed with `node_modules` temporarily removed and then restored.
- MCP smoke including daemon self-spawn passed.

## 初步归因

Resolved by a self-contained generated runtime and clean-distribution gate.

## 交付给哪个 Agent

Development Agent completed implementation; Test Supervisor and Customer Support completed verification and documentation.

## 需要回答的问题

- None for the packaging defect. Real Windows native-host acceptance is a separate issue.

## 相关文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/plugin-distribution-smoke.mjs`
- `.github/workflows/canvasight-plugin.yml`

## 期望结果

Clean installed snapshots start and expose the Canvasight MCP tools without manual npm commands.

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

自包含 MCP bundle、版本升级、干净分发测试、跨平台 CI 和双语升级说明已完成。

## 修改文件

- Runtime source/generated entry and build metadata.
- Distribution regression and OS matrix workflow.
- README, AGENTS and Agent Team delivery records.

## 验证方式

- Bundle check, clean distribution, registration probe, MCP/full supporting smoke suites and plugin validator.

## 后续风险

Windows native fullscreen ready/control/Run acceptance remains pending in `issue-windows-native-acceptance-0-4-10`.
