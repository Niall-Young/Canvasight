---
status: resolved
report_type: issue
owner: development-agent
created_by: product-agent
priority: medium
created_at: 2026-07-05 21:53
updated_at: 2026-07-05 22:01
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-graph-writer/references/graph-types.md
  - README.md
solution_report: agent-reports/resolved/20260705-2201-development-solution-project-guidance-nodes.md
---

# software-product 图缺少项目规范文档节点规则

## TL;DR

AI 写 `software-product` 画布时，应只在目标项目根目录缺少 `AGENTS.md` 或 `design.md` 时创建补文档节点；文件存在时不要创建，也不要判断内容是否完整。

## 发现者

Product Agent

## 提交 Agent

Product Agent

## 建议交接 Agent

Development Agent

## 问题描述

当前 skill 文档使用“missing or incomplete”描述，且 MCP 写图层不会自动检查项目文件。用户希望规则更明确：没有的项目就补充上，有的项目就不管，并在画布里创建对应节点。

## 现象

- AI 手动生成的 Figma 插件画布没有根据项目是否缺文档补 `AGENTS.md` / `design.md` 节点。
- 当前规则依赖 AI 遵守 skill 文档，不能在 `write_canvasight_graph` 层稳定执行。
- “incomplete” 可能导致已有文件的项目仍被加入补文档节点，和用户要求冲突。

## 复现方式

1. 选择一个没有 `AGENTS.md` / `design.md` 的项目。
2. 用 `write_canvasight_graph` 写入 `graphType: "software-product"` 的产品画布。
3. 观察画布不会自动补“创建 AGENTS.md / design.md”的节点。

## 影响范围

- AI 生成产品/插件需求画布。
- `software-product` graphType 规则。
- README 和 graph-writer skill 文档。
- MCP smoke test。

## 证据

- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-types.md` 原来写的是 missing or incomplete。
- `plugins/canvasight/mcp/server.mjs` 原来只按传入 nodes 生成画布，不检查 `AGENTS.md` / `design.md`。

## 初步归因

项目规范文档节点被定义成 AI 生成策略建议，没有成为 MCP 写图层的确定性规则。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- `write_canvasight_graph` 应在什么条件下自动补节点？
- 生成节点如何命名和连接？
- 如何避免已有 `AGENTS.md` / `design.md` 的项目生成多余节点？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-types.md`
- `README.md`

## 期望结果

- `graphType: "software-product"` 时检查目标项目根目录。
- 缺 `AGENTS.md` 就生成一个“补充 AGENTS.md”节点。
- 缺 `design.md` 就生成一个“补充 design.md”节点。
- 两个文件都存在时不生成这些节点。
- 不判断文件内容完整度。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。`write_canvasight_graph` 现在会在 `graphType: "software-product"` 的第一页写入前检查目标项目根目录，按缺失文件自动追加 `补充 AGENTS.md` / `补充 design.md` 任务节点，并在 structuredContent 返回 `projectGuidanceNodes`。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-types.md`
- `README.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run test:mcp`
- `npm run typecheck`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`

## 后续风险

- v1 只做根目录文件存在性判断，不审查已有文件内容质量。
- 自动补节点只适用于 `software-product`，不会影响文章、代码库结构或普通任务计划类图。
