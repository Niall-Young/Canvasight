---
schema_version: 1
report_id: issue-skill-led-project-guidance-omission
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T07:01:00Z
updated_at: 2026-07-14T07:01:00Z
depends_on:
  - issue-agents-md-guidance-agent-team-opt-in
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - Skill-led software-product smoke now creates the missing AGENTS.md guidance node.
  - Skill-led non-product smoke remains free of software-product guidance nodes.
solution_report: solution-skill-led-project-guidance-omission
---

# Skill-led 软件产品图遗漏缺失的 AGENTS.md 指导节点

## TL;DR

`skill-led` 只应决定专业内容由哪个 Skill 主导，不应关闭软件产品项目的 `AGENTS.md` / `design.md` 缺失检查。

## 问题描述

`requiresSoftwareProductGuidance()` 对 `contentMode: skill-led` 提前返回 `false`，导致 `primaryDomain: software-product` 且非 `refine` 的写图路径完全绕过项目指导节点生成与最终校验。

## 处理结果

- software-product 非 refine 写图不再因 skill-led 跳过项目指导。
- 只豁免本次服务端实际自动生成的指导节点，不允许任意 `projectGuidanceFile` 标记绕过专业 Skill coverage。
- refine 与非 software-product 仍不生成项目指导节点。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- 0.4.19 版本字段与生成的 MCP bundle。

## 验证方式

- `npm --prefix plugins/canvasight run build`
- `npm --prefix plugins/canvasight run test:mcp`
- `npm --prefix plugins/canvasight run check:mcp-bundle`
- `npm --prefix plugins/canvasight run release:verify -- 0.4.19`
- 插件校验脚本。

## 后续风险

- 本轮不改变 UI、设置持久化或 native widget host 行为。

## Closure Criteria

- [x] skill-led software-product 缺 `AGENTS.md` 时创建指导节点。
- [x] 自动节点不触发 `skill_led_node_coverage_missing`。
- [x] 普通未覆盖节点仍被 coverage 门禁拒绝。
- [x] 非软件产品 skill-led 仍不生成项目指导节点。
