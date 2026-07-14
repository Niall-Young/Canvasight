---
schema_version: 1
report_id: issue-agent-team-only-agents-guidance
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T07:31:10Z
updated_at: 2026-07-14T07:31:10Z
depends_on:
  - issue-skill-led-project-guidance-omission
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - MCP smoke covers missing, Agent-Team-managed-only, and substantive AGENTS.md states.
  - Build, bundle freshness, release consistency, and plugin validation passed.
solution_report: solution-agent-team-only-agents-guidance
---

# Agent Team 受管协议让 AGENTS.md 指导节点错误消失

## TL;DR

开启 Agent Team 后生成的受管协议块不能替代项目自身的 `AGENTS.md` 规则；只有受管块外存在实质项目内容时，指导节点才应去重。

## 问题描述

`ensureAgentTeamAgentsMd()` 会在 Run 前创建或刷新受管协议块。旧的 `projectHasGuidanceFile()` 只检查文件路径是否存在，因此把仅含受管协议的文件误判为项目规则已经完整。

## 处理结果

- `AGENTS.md` 缺失：继续生成“补充 AGENTS.md”。
- `AGENTS.md` 仅含完整 Canvasight Agent Team 受管块：生成“完善 AGENTS.md”，要求保留受管块并在块外补齐项目规则。
- 受管块外已有实质内容：不重复生成。
- 手写“完善 AGENTS.md”节点也参与意图去重。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- 0.4.20 版本字段与生成的 MCP bundle。

## 验证方式

- `npm --prefix plugins/canvasight run build`
- `npm --prefix plugins/canvasight run test:mcp`
- `npm --prefix plugins/canvasight run check:mcp-bundle`
- `npm --prefix plugins/canvasight run release:verify -- 0.4.20`
- 插件校验脚本。

## 后续风险

- 标记缺失、不成对或文件读取失败时保守视为已有文件，不尝试剥离或改写用户内容。

## Closure Criteria

- [x] Agent Team managed-only 文件仍生成项目规则节点。
- [x] 节点文案明确保留受管块且不重复扩写 Agent Team。
- [x] managed + substantive 文件不重复生成。
- [x] 注入与最终 framework validation 共用同一状态判定。
