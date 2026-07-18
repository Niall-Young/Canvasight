---
schema_version: 1
report_id: solution-windows-cli-daemon-state-cleanup-0-4-35
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T12:19:00Z
updated_at: 2026-07-18T12:19:00Z
depends_on:
  - issue-windows-cli-daemon-state-cleanup-0-4-34
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - Complete local 0.4.35 release matrix passed.
  - Windows Node 20.19 job 88078901989 passed the enhanced target/control/replacement MCP runtime regression.
---

# 0.4.35 Windows daemon stop 状态清理方案

## TL;DR

把 stop success 从“已发送 SIGTERM”收紧为“目标 PID 已退出且原 ownership state 已清理”，并用 pid、token、pluginRoot 防止 replacement race。

## 根因

Windows 的 `process.kill(pid, "SIGTERM")` 可直接终止进程，daemon 的异步 shutdown handler 来不及删除 `daemon.json`；旧 stopper 又在发出信号后立即返回成功。

## 方案

- 等待目标 PID 最多三秒退出，未退出则明确失败。
- 状态清理只在 pid、token、pluginRoot 与原 daemon 完全匹配时执行。
- 回归覆盖 CLI 参数优先级、控制 home 字节不变、目标 health 失联、立即 replacement 新 identity 与二次 stop。

## 验证

- 本地完整矩阵与增强 `test:mcp` 通过。
- Windows Node 20.19 workflow 通过。

## 后续风险

- 不得将 ownership matching 弱化为仅 PID 或无条件状态删除。
