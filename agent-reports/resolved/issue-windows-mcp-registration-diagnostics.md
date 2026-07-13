---
schema_version: 1
report_id: issue-windows-mcp-registration-diagnostics
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T03:03:48Z
updated_at: 2026-07-13T03:09:22Z
depends_on: []
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-registration-probe.mjs
  - plugins/canvasight/package.json
  - README.md
verification_status: passed
verification_evidence:
  - diagnose:mcp completed initialize and tools/list and found both required open tools
  - typecheck, build, MCP smoke, and plugin validation passed
  - installed cache 0.4.8+codex.20260713111000 passed the same registration probe
  - real Windows Codex Desktop registration remains external acceptance evidence
solution_report: solution-windows-mcp-registration-diagnostics
---

# Windows MCP 已安装但工具未注册

## TL;DR

Canvasight now provides a cross-platform registration probe and richer sanitized MCP startup lifecycle evidence, without changing the standard portable `.mcp.json` Node command or any widget/daemon contract.

## 处理结果

- Added manifest Node resolution, `initialize`, `tools/list`, required-tool and lifecycle diagnostics.
- Added Node executable/version, platform, architecture, parent PID and cwd to `stdio_start`.
- Added bilingual Windows stage-based recovery and a durable diagnostic command.
- Synchronized plugin version to `0.4.8+codex.20260713111000`.

## 修改文件

- `plugins/canvasight/tests/mcp-registration-probe.mjs`
- `plugins/canvasight/mcp/server.mjs`
- plugin version/package files
- `README.md` and `AGENTS.md`

## 验证方式

- `npm run diagnose:mcp`
- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- plugin validator

## 后续风险

Windows 用户仍需从实际安装缓存运行 probe，并在真实 Codex Desktop 中确认工具注册；这轮没有原生 fullscreen ready 证据，不能声称画布已打开。
