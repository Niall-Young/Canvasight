---
schema_version: 1
report_id: solution-windows-mcp-registration-diagnostics
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T03:09:22Z
updated_at: 2026-07-13T03:09:22Z
depends_on:
  - issue-windows-mcp-registration-diagnostics
related_files:
  - plugins/canvasight/tests/mcp-registration-probe.mjs
  - plugins/canvasight/mcp/server.mjs
  - README.md
verification_status: passed
verification_evidence:
  - isolated Content-Length initialize and tools/list handshake passed with 14 tools
  - lifecycle startup fields were asserted against the running Node process
---

# Windows MCP 注册诊断方案

## Root Cause

现有对话只能证明插件清单已加载、工具注册缺失；没有 Windows lifecycle 证据可证明 `.mcp.json` 的 `node` 入口失败。裸运行 server 持续等待是正常 stdio 行为。

## 推荐方案与处理结果

保留标准跨平台 `command: node`，增加无 daemon、无 widget 副作用的 MCP probe，并让 `stdio_start` 提供脱敏的运行时身份。README 依据 lifecycle 阶段区分未启动、未握手和任务注册快照问题。

## 风险与回滚

Probe 仅验证 MCP server 握手，不验证 Desktop 工具表或 native widget。可通过移除独立 probe、npm script 和新增 lifecycle 字段回滚，不影响画布数据。

## 验证方式

- doctor、typecheck、build、MCP smoke、plugin validator 均通过。
- Agent Team validator 仍被既有 legacy 报告与旧模板阻断。
