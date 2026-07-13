---
schema_version: 1
report_id: solution-mcp-distribution-self-contained
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T07:02:28Z
updated_at: 2026-07-13T07:02:28Z
depends_on:
  - issue-mcp-distribution-missing-dependencies
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/scripts/build-mcp.mjs
  - plugins/canvasight/tests/plugin-distribution-smoke.mjs
verification_status: passed
verification_evidence:
  - Self-contained installed entry completes initialize and tools/list with 14 tools without node_modules.
  - MCP smoke including daemon self-spawn passes.
  - Exact installed cache version passes the registration probe with node_modules temporarily removed.
---

# MCP 自包含分发方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/issue-mcp-distribution-missing-dependencies.md`

## Root Cause

The installed MCP entry imported npm packages at process startup, while Git-backed marketplace snapshots omit ignored `node_modules`. Local macOS testing accidentally copied a dependency-populated development tree and concealed the distribution defect.

## 调研过程

- Reproduced the Windows error on macOS from a clean Git snapshot.
- Confirmed the existing installed macOS cache contained about 123 MB of dependencies.
- Proved an esbuild Node ESM bundle registers all 14 tools without external packages.

## 可选方案

- Install dependencies into every version cache: rejected because it needs package-manager access, network/cache availability, permissions, and manual recovery after every upgrade.
- Ship `node_modules`: rejected because it is large and unreliable across source types and platforms.
- Ship a generated self-contained MCP entry: selected because it preserves the manifest and tool contracts while removing install-time dependency assumptions.

## 推荐方案

Keep `mcp/server.source.mjs` as editable source and generate the installed `mcp/server.mjs` with esbuild for Node 20. Commit the generated entry, verify it is current before build, and exercise a copied plugin with all dependency/cache directories excluded.

## 实施步骤

1. Added deterministic build and consistency-check commands plus a direct esbuild development dependency.
2. Bumped all runtime version locations to `0.4.10+codex.20260713145428`.
3. Added clean-distribution smoke and Windows/macOS/Linux CI.
4. Updated bilingual installation and legacy Windows recovery guidance.

## 风险与回滚

The generated entry is larger than source and must be regenerated after source changes. `check:mcp-bundle` prevents stale delivery. Rollback is the previous source entry and package metadata, but that would restore the clean-install failure.

## 处理结果

Packaging defect resolved.

## 修改文件

- MCP source, generated entry, build script, package metadata and lockfile.
- Clean-distribution test and cross-platform workflow.
- README, AGENTS, roster, queue and delivery reports.

## 验证方式

- `npm run check:mcp-bundle`
- `npm run test:plugin-distribution`
- `npm run diagnose:mcp`
- `npm run test:mcp`
- Exact installed-cache probe without `node_modules`

## 后续风险

The GitHub Actions matrix has not executed until the commit is pushed. Real Windows Codex fullscreen ready/control/Run acceptance is tracked separately and remains unverified.
