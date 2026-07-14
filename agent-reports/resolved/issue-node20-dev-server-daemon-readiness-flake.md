---
schema_version: 1
report_id: issue-node20-dev-server-daemon-readiness-flake
report_type: issue
status: resolved
owner: Development Agent
created_by: Test Supervisor Agent
priority: high
version: 3
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T07:59:33Z
updated_at: 2026-07-14T08:20:38Z
depends_on: []
solution_report: agent-reports/resolved/solution-node20-dev-server-daemon-readiness-flake.md
related_files:
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
verification_status: passed
verification_evidence:
  - Node 20.19 test:dev-server failed five times across fresh invocations while Node 25 passed.
  - Failures included unbound Run expected 409 but received 500, claim fetch failed, claim daemon timeout, and preferences daemon timeout.
  - Clearing 71 explicit temporary test-orphan daemons did not eliminate the failure.
  - Instrumentation observed one Vite parent spawning two Node 20.19 daemon children for the same test home before daemon startup timed out.
  - Development Agent added shared cross-process daemon-start locking and a two-Vite same-home regression.
  - The fixed code passed eight consecutive Node 20.19.0 dev-server smoke runs during development.
  - Development verification passed release prepare/verify, MCP bundle freshness, production build/typecheck, and MCP runtime smoke.
  - Final unpublished Canvasight 0.4.20 passed five consecutive Main Thread and three consecutive Test Supervisor Node 20.19.0 runs.
  - Test Supervisor confirmed the final plugin diff is dev-only, the 0.4.20 MCP/native runtime bytes remain unchanged, and no temporary test process residue remained.
---

# Node 20.19 dev-server daemon readiness 间歇失败

## TL;DR

`test:dev-server` 在发布目标 Node 20.19 下会间歇启动同一测试 home 的两个 daemon 子进程并超时；最终 0.4.20 候选已统一 Vite 与 MCP 的跨进程锁并通过独立复验。

## 问题描述

核心 GitHub release workflow 测试通过，但仓库当前发布检查还要求 dev-server 生命周期可靠。重复测试证明失败不是单次断言波动或残留端口污染，可能存在 daemon readiness、状态复用或 single-flight 竞态。

## 影响范围

项目级 dev server、daemon 启动、测试隔离与 Canvasight 0.4.20 发布可信度。

## 期望结果

- 同一 project/test home 的并发 daemon 启动保持 single-flight。
- Node 20.19 下重复 `test:dev-server` 稳定通过。
- 不改变正常 repo-local daemon 生命周期与安装快照合同。

## Closure Criteria

- [x] 根因明确并记录
- [x] 最小修复完成
- [x] Development Agent 的 Node 20.19 重复回归稳定通过
- [x] MCP bundle、MCP runtime、build 与 release version 同步通过
- [x] Test Supervisor Agent 独立复验

## 当前状态

resolved

## 处理结果

Vite 开发 API 现与 MCP 共用 `daemon-start.lock`，只允许持锁实例 spawn daemon，并在锁内二次检查健康 state。由于 `v0.4.20` 尚未发布且改动只影响 dev runtime，最终候选保持 0.4.20；Development、Main Thread 与 Test Supervisor 的独立重复验证全部通过。

## 修改文件

- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`

## 验证方式

- Development Agent 使用 Node 20.19.0 连续八次执行 `tests/dev-server-smoke.mjs`，全部通过。
- `npm run check:mcp-bundle`、`npm run release:verify -- 0.4.20`、`npm run test:mcp` 全部通过。
- `npm run release:prepare -- 0.4.20` 完成 MCP bundle、typecheck 和 Vite build。
- Main Thread：最终 0.4.20 在 Node 20.19.0 连续五次通过。
- Test Supervisor Agent：最终 0.4.20 在 Node 20.19.0 连续三次通过，并复核并发回归的 PID/token 稳定性合同。

## 后续风险

- 该竞态 blocker 已解除；正式发布仍需独立完成 native-host 控件、同任务 Run、late-metadata 与远端 release gates。
