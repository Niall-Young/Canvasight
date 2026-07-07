---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: critical
created_at: 2026-07-07 21:52
updated_at: 2026-07-07 21:52
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/scripts/dev-server.mjs
---

# MCP stdio transport lifecycle integration

## 本轮目标

- Make Canvasight MCP transport failures diagnosable and recover stale daemon state without browser fallback success paths.

## Agent 状态

- Product Agent：main thread checklist completed.
- Design Agent：no UI behavior change.
- Development Agent：runtime implementation completed.
- Test Supervisor Agent：smoke/build/plugin validation completed.
- Customer Support Agent：README updated.
- Design Standards Expert：design.md updated for MCP shim lifecycle.
- Development Standards Lead：AGENTS.md updated.
- Project Management Agent：git status checked.
- Skill Expert Agent：Canvasight open/run/troubleshooting skills updated.

## Agent 输入

- Product Agent：normal Run remains native widget only.
- Design Agent：diagnostics and fallback semantics unchanged.
- Development Agent：stdio lifecycle and daemon cleanup implemented.
- Test Supervisor Agent：added lifecycle, content-length, unknown-tool, and stale daemon smoke coverage.
- Customer Support Agent：documented 0.1.44 install and recovery behavior.
- Design Standards Expert：recorded shim/daemon separation.
- Development Standards Lead：recorded command and verification updates.
- Project Management Agent：prepared version bump and commit scope.
- Skill Expert Agent：updated Transport closed troubleshooting contract.

## 报告状态变更

- `agent-reports/resolved/20260707-2152-development-issue-mcp-stdio-transport-lifecycle.md` created resolved.
- `agent-reports/resolved/20260707-2152-development-solution-mcp-stdio-transport-lifecycle.md` created.

## 已解决

- MCP stdio lifecycle logs now exist for new 0.1.44 shims.
- Tool-level failures return JSON-RPC errors and are covered by smoke tests.
- stdin end exits cleanly without stopping the project daemon.
- Stale state-pointed daemon and old cache-version daemon cleanup is implemented.
- Plugin cache is installed at 0.1.44 and dev server reports 0.1.44.

## 未解决

- Current already-open Codex thread still returns `Transport closed` and writes no lifecycle log, so it is still holding a closed pre-0.1.44 host transport.

## 风险

- New/reloaded thread is required for true native tool invocation verification.

## 下一轮分派

- If a new/reloaded thread still fails, inspect `~/.canvasight/mcp-lifecycle.log` first and then continue at Codex host MCP injection/transport behavior.

## 已完成改动

- Hardened MCP stdio request dispatch, stdin shutdown, process errors, and lifecycle logging.
- Tightened daemon stale cleanup and dev status.
- Added smoke coverage and updated docs/skills.
- Bumped Canvasight to `0.1.44`.

## 处理结果

已完成

## 修改文件

- Runtime, dev-server, tests, docs, skills, version metadata, and reports.

## 验证方式

- `npm run test:markdown`
- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- `npm run test:dev-server`
- plugin validator
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`
- `npm run dev && npm run dev:status`

## 验证记录

- All listed checks passed.
- `codex plugin list` shows `canvasight@canvasight-local` enabled at `0.1.44`.
- `npm run dev:status` shows `running http://127.0.0.1:5173 pid=16619 serverVersion=0.1.44`.
- Current-thread `list_canvasight_recent_projects` still returns `Transport closed` with no `mcp-lifecycle.log`, confirming the live thread did not launch the new shim.

## 回写状态

- `agent-reports/QUEUE.md` updated.
- Related issue report updated.
- Solution report written.

## 未解决 / 后续风险

- Already-open thread MCP hot-swap remains outside plugin runtime control.

## Git 状态

- branch: main
- commit: this commit (`fix: 修复 Canvasight MCP stdio transport 生命周期`; see `git log -1`)
- worktree: clean after commit
