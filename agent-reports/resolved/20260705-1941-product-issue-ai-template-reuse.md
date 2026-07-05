---
status: resolved
report_type: issue
owner: development-agent
created_by: product-agent
priority: medium
created_at: 2026-07-05 19:41
updated_at: 2026-07-05 19:48
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260705-1948-development-solution-ai-template-reuse.md
---

# AI 写图未复用全局节点模板

## TL;DR

`write_canvasight_graph` 原本只能写入 AI 提供的节点内容，不能让 AI 先扫描并复用用户保存的全局节点模板。

## 发现者

Product Agent

## 提交 Agent

Product Agent

## 建议交接 Agent

Development Agent

## 问题描述

用户已经可以把常用节点保存为全局模板，但 AI 写图能力没有提供模板扫描入口，也没有在写入节点时使用模板标题、内容和附件的协议。这样 AI 生成画布会重新造节点，无法复用用户沉淀的提示词资产。

## 现象

- MCP tools 中没有面向 AI 的全局模板列表工具。
- `write_canvasight_graph` 的节点输入没有 `templateId` / `templateQuery` 复用语义。
- `canvasight-graph-writer` skill 没有要求写图前检查模板。

## 复现方式

1. 在 Canvasight 网页中保存一个包含提示词和附件的全局节点模板。
2. 让 Codex 根据一个产品需求调用 `write_canvasight_graph` 创建画布。
3. 观察生成节点未引用已有模板，也不会继承模板附件。

## 影响范围

- AI 生成画布的质量和一致性。
- 全局节点模板的复用价值。
- `write_canvasight_graph` MCP contract。
- `canvasight-graph-writer` skill 工作流。

## 证据

- `plugins/canvasight/mcp/server.mjs` 已有 `readNodeTemplates()`，但 MCP tools 未暴露列表工具。
- `normalizeGraphNode()` 只读取节点传入的 `title`、`body`、`attachments`。
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md` 未提到模板扫描。

## 初步归因

模板功能先作为网页侧拖拽复用实现，AI 写图能力后来加入，没有把全局模板存储接入 MCP 写图协议。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- AI 应通过哪个 MCP tool 扫描全局节点模板？
- `write_canvasight_graph` 如何表达“这个节点复用哪个模板”？
- 复用模板时标题、内容、附件与 AI 提供字段的合并优先级是什么？
- 如何验证模板附件被复用到生成节点？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md`
- `README.md`

## 期望结果

AI 写图前能扫描全局节点模板；当节点指定 `templateId` 或可由查询匹配模板时，生成节点继承模板的标题、内容和附件，并在 MCP 返回结构中记录复用结果。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。新增 `list_canvasight_node_templates`，`write_canvasight_graph` 支持 `templateId` / `templateQuery` 复用全局节点模板，并返回 `reusedTemplates`。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-types.md`
- `README.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`

## 后续风险

模板附件沿用当前网页拖拽模板的全局附件引用模型，没有在写图时复制进项目 `.scatter/assets`。这保持现有产品一致性，但未来如果要让生成项目完全脱离全局模板资产，需要单独做附件复制策略。
