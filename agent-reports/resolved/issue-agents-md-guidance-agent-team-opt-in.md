---
schema_version: 1
report_id: issue-agents-md-guidance-agent-team-opt-in
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: medium
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T06:19:39Z
updated_at: 2026-07-14T06:19:39Z
depends_on: []
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - MCP smoke covers software-product guidance generation without Agent Team configuration.
  - The generated AGENTS.md node body now explicitly keeps optional workflows opt-in.
solution_report: solution-agents-md-guidance-agent-team-opt-in
---

# 未开启 Agent Team 时 AGENTS.md 指导节点仍要求团队分工

## TL;DR

软件产品图缺少 `AGENTS.md` 时自动补充的通用节点硬编码了“Agent Team 分工”，与设置开关无关，导致未开启 Agent Team 的用户仍看到错误要求。

## 问题描述

`SOFTWARE_PRODUCT_GUIDANCE_FILES` 的 `AGENTS.md` 静态正文同时用于新 Page 和 merge 补充路径。该正文不读取 Agent Team 设置，因此不能把可选 Agent Team 当作通用项目治理要求。

## 处理结果

- 保留缺失 `AGENTS.md` 的通用指导节点。
- 正文只要求基于项目内容归纳上下文、工作规则、实现约束、验证命令和 git 约定。
- 明确禁止默认加入 Agent Team 等未启用的可选流程。
- 增加完整正文回归断言。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- MCP 版本字段与生成产物。

## 验证方式

- `npm --prefix plugins/canvasight run test:mcp`
- `npm --prefix plugins/canvasight run check:mcp-bundle`
- `npm --prefix plugins/canvasight run release:verify -- 0.4.18`
- 插件校验脚本。

## 后续风险

- 无 UI 或 native widget 行为变化；不需要浏览器或原生宿主验收。

## Closure Criteria

- [x] 通用节点不再要求 Agent Team 分工。
- [x] 未启用可选流程的边界写进节点正文。
- [x] MCP smoke 覆盖完整正文。
- [x] 版本与 MCP bundle 同步。
