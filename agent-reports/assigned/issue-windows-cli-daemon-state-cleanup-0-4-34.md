---
schema_version: 1
report_id: issue-windows-cli-daemon-state-cleanup-0-4-34
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T11:46:32Z
updated_at: 2026-07-18T11:46:32Z
depends_on:
  - issue-publish-stable-release-0-4-34
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: not_started
verification_evidence:
  - GitHub Actions run 29642945206 passed macOS and Ubuntu but failed Windows Node 20.19 in npm run test:mcp.
  - Windows job 88076349821 reported CLI-selected target daemon state must be removed at tests/mcp-smoke.mjs:2831.
  - Read-only diagnosis confirmed CLI --canvasight-home precedence is correct; Windows process.kill(pid, SIGTERM) can terminate before daemon asynchronous state cleanup runs.
---

# Windows CLI 停止 daemon 后残留目标状态

## TL;DR

Windows 上 CLI 选择目标 `CANVASIGHT_HOME` 停止 daemon 时，目标进程退出但 `daemon.json` 残留，阻断 0.4.34 Release gate。

## Closure Criteria

- [x] 根因定位到 Windows SIGTERM 与异步状态清理边界
- [x] stopper 等待目标 PID 退出，并只清理仍匹配原 pid、token、pluginRoot 的状态
- [x] 测试明确要求 stopper 成功退出后再检查目标状态与控制 home 隔离
- [ ] 0.4.35 完整本地矩阵通过
- [ ] Windows Node 20.19 Release workflow 通过同一回归
- [ ] solution 与 integration summary 回写完成

## 当前状态

assigned。Development Agent 已完成源码与测试修复，等待 0.4.35 版本同步、完整验证与 Windows CI 权威确认。

## 处理结果

修复候选只在状态仍属于原 daemon 时清理；替代 daemon 的新状态不会被旧 stopper 删除。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run test:mcp`
- `npm run check:mcp-bundle`
- 0.4.35 GitHub Windows Node 20.19 Release job

## 后续风险

macOS 本地通过不能替代 Windows 平台确认；0.4.35 在 Windows gate 通过前不得发布或推进 stable。
