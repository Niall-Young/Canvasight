---
schema_version: 1
report_id: issue-windows-cli-daemon-state-cleanup-0-4-34
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 4
agent_id: /root/development_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T11:46:32Z
updated_at: 2026-07-18T12:19:00Z
depends_on:
  - issue-publish-stable-release-0-4-34
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/solution-windows-cli-daemon-state-cleanup-0-4-35.md
verification_status: passed
verification_evidence:
  - 0.4.35 waits for target PID exit and removes state only while pid, token and pluginRoot match the original daemon.
  - Local regression proves target health loss, byte-identical control state, immediate replacement safety and replacement cleanup.
  - GitHub Actions Windows Node 20.19 job 88078901989 passed Test MCP runtime in workflow 29643956675.
---

# Windows CLI 停止 daemon 后残留目标状态

## TL;DR

Windows 的 CLI-selected target daemon 状态残留已由 0.4.35 ownership-safe stop completion 修复，并通过 Windows Node 20.19 权威回归。

## Closure Criteria

- [x] 根因明确
- [x] stopper 等待目标 PID 退出并只清理匹配原 daemon 的状态
- [x] target/control/replacement 回归通过
- [x] Windows Node 20.19 workflow 通过
- [x] solution 与 integration summary 回写完成

## 当前状态

resolved。

## 处理结果

Windows daemon 无法完成异步 SIGTERM 清理时，stopper 在确认旧 PID 退出后进行精确 ownership match 清理，不会误删立即启动的 replacement state。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- 本地 `npm run test:mcp`
- GitHub Actions Windows Node 20.19 `Test MCP runtime`

## 后续风险

未来 daemon stop identity 变化需保持 replacement-safe ownership contract。
