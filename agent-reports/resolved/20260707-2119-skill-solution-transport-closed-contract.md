---
status: resolved
report_type: solution
owner: skill-expert-agent
created_by: main-thread
priority: high
created_at: 2026-07-07 21:19
updated_at: 2026-07-07 21:19
related_issue: agent-reports/resolved/20260707-1127-development-issue-current-thread-mcp-transport-closed.md
related_files:
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md
  - plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
  - AGENTS.md
---

# Transport Closed Skill Contract

## 负责 Agent

Skill Expert Agent, performed by main-thread for this delivery.

## 对应问题

`agent-reports/resolved/20260707-1127-development-issue-current-thread-mcp-transport-closed.md`

## Root Cause

Canvasight skills documented missing native tools and browser fallback misrouting, but did not explicitly classify the case where Canvasight MCP tools are visible and the live Codex thread returns `Transport closed`. That left room for Codex to misroute recovery back to localhost browser fallback or keep promising queued Run recovery from the same stale thread.

## 调研过程

- Reproduced the current-thread symptom: visible Canvasight MCP tool call fails with `Transport closed`.
- Confirmed this is not the same as `native_canvasight_tool_unavailable`; tool metadata can exist while the thread-local transport is closed.
- Confirmed browser fallback remains diagnostic/queued-only and cannot replace native widget bridge delivery.

## 可选方案

- 方案 A：只在 final answer 解释 reload/new thread。Rejected because the same failure would recur in future skill-triggered flows.
- 方案 B：Write the failure mode into open/run/troubleshooting skills and lock it with smoke assertions. Chosen.

## 推荐方案

Classify visible-tool `Transport closed` as `canvasight_mcp_transport_closed`. Stop open/run recovery in the current stale thread, ask for reload/new thread, and prohibit treating browser fallback as native Run recovery.

## 实施步骤

1. Updated Canvasight open/run/troubleshooting skill instructions and references.
2. Updated README and AGENTS runtime notes.
3. Added MCP smoke assertions so the contract remains present.
4. Bumped Canvasight plugin version to `0.1.43`.

## 风险与回滚

The change is instructional and version metadata only; it does not change runtime bridge code. Rollback is reverting the documentation/test/version commit, but doing so would reintroduce the ambiguous recovery path.

## 处理结果

已修复 skill/documentation/test coverage for this failure classification. Live thread transport recovery remains reload/new thread because the current closed MCP transport cannot be repaired from Canvasight runtime code.

## 修改文件

- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`
- `AGENTS.md`

## 验证方式

- `node --check plugins/canvasight/mcp/server.mjs`
- `node --check plugins/canvasight/tests/mcp-smoke.mjs`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-open`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-run`
- `python3 /Users/niallyoung/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/canvasight/skills/canvasight-troubleshooting`
- `npm run test:markdown`
- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`
- `npm run dev:status`

## 后续风险

If a fresh/reloaded thread still cannot render a native widget or expose a send-capable host bridge, the next investigation should stay on tool/resource descriptor or Codex Desktop host support. It must not reintroduce app-server `turn/start`, virtual clicks, clipboard, Accessibility, DOM automation, or browser fallback as a success path.
