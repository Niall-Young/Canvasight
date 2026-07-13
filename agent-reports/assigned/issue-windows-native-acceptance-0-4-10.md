---
schema_version: 1
report_id: issue-windows-native-acceptance-0-4-10
report_type: issue
status: assigned
owner: Test Supervisor Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-13T07:02:28Z
updated_at: 2026-07-13T07:35:33Z
depends_on:
  - issue-mcp-distribution-missing-dependencies
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/plugin-distribution-smoke.mjs
  - .github/workflows/canvasight-plugin.yml
verification_status: not_started
verification_evidence:
  - GitHub Actions run 29232468700 passes Windows, macOS and Linux clean-distribution, 14-tool registration and full MCP runtime gates.
  - No real Windows Codex fullscreen instance evidence is available in this workspace.
solution_report: null
---

# Windows 原生宿主验收 0.4.10

## TL;DR

Packaging is fixed, but a real Windows Codex Desktop must still prove verified fullscreen ready, a meaningful canvas control and same-task native Run delivery.

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Test Supervisor Agent

## 问题描述

CI and local probes cannot mount the production Windows Codex native widget or prove the host bridge sends Run output to the same task.

## 现象

The prior user session could display browser fallback after manual dependency recovery, while native ready remained timeout/unverified.

## 复现方式

1. Upgrade the Git marketplace plugin to exact version `0.4.10+codex.20260713151335`.
2. Fully quit and restart Codex Desktop, then create a new task and tag `@Canvasight`.
3. Run the native open/await contract, use a canvas control, and send one node Run.

## 影响范围

Windows native-host acceptance only; the cross-platform packaging defect is resolved separately.

## 证据

- Supporting automated tests pass.
- No instance-bound Windows `verified=true` result is available yet.

## 初步归因

External acceptance evidence is missing, not a newly observed runtime failure.

## 交付给哪个 Agent

Test Supervisor Agent, with evidence supplied from the Windows user machine.

## 需要回答的问题

- Does `await_canvasight_widget_ready` return fullscreen verified ready with all render evidence true?
- Does a meaningful canvas control work?
- Does node Run reach the same newly created Codex task?

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `.github/workflows/canvasight-plugin.yml`

## 期望结果

The exact installed Windows version passes the full native-host gate without manual npm recovery.

## Closure Criteria

- [ ] 问题原因明确
- [ ] 方案报告已回写
- [ ] 修改文件已记录
- [ ] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

assigned

## 处理结果

Awaiting real Windows evidence.

## 修改文件

- None pending evidence.

## 验证方式

- Exact version, restarted host, new tagged task, native open/await/control/Run sequence.

## 后续风险

Browser fallback or local daemon health cannot close this issue.
