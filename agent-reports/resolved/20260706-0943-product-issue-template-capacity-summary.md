---
status: resolved
report_type: issue
owner: development-agent
created_by: product-agent
priority: medium
created_at: 2026-07-06 09:43
updated_at: 2026-07-06 09:43
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/RightDrawer.tsx
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
solution_report: agent-reports/resolved/20260706-0943-development-solution-template-capacity-summary.md
---

# 模板容量与 AI 摘要读取缺口

## TL;DR

全局节点模板需要明确 200 个容量上限和用户可见管理路径，同时 AI 扫描模板时必须先读摘要，避免把大量模板正文和附件一次性塞进上下文。

## 发现者

Product Agent

## 提交 Agent

Product Agent

## 建议交接 Agent

Development Agent

## 问题描述

用户指出两个风险：保存到 200 个模板后继续保存时，GUI 需要明确处理和告知；AI 复用模板时如果模板很多，直接读取完整模板会消耗大量上下文。

## 现象

- 旧实现会在写入时裁剪模板列表，存在静默移除旧模板的产品风险。
- `list_canvasight_node_templates` 返回完整模板内容和附件，200 个模板时容易造成上下文浪费。
- 模板侧栏没有容量状态，也没有直接删除模板的管理入口。

## 复现方式

1. 创建或导入大量全局节点模板。
2. 达到 200 个模板后继续保存新模板。
3. 调用 AI 画布写入流程，让 Codex 扫描模板库。

## 影响范围

影响全局模板保存、模板侧栏管理、AI 画布生成前的模板复用流程、MCP tool contract、README、design.md、Skill 文档。

## 证据

- 用户问题：200 个模板后的 GUI 处理和告知。
- 用户问题：模板很多时上下文是否会爆。
- 代码风险：服务端和本地 fallback 都存在无提示裁剪模板列表的行为。

## 初步归因

模板功能最初只覆盖基础保存/拖拽，缺少容量管理、删除闭环和摘要优先的 AI 读取协议。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 保存第 201 个模板时应该阻止、替换还是静默裁剪？
- AI 什么时候读摘要，什么时候读完整模板？
- 模板侧栏如何让用户知道容量并管理旧模板？

## 相关文件

- plugins/canvasight/mcp/server.mjs
- plugins/canvasight/shared/types.ts
- plugins/canvasight/src/App.tsx
- plugins/canvasight/src/components/RightDrawer.tsx
- plugins/canvasight/src/lib/canvasightApi.ts
- plugins/canvasight/skills/canvasight-graph-writer/SKILL.md

## 期望结果

达到 200 个模板时不再静默删除旧模板；GUI 明确提示并允许管理或显式替换最旧模板；AI 默认只读取模板摘要，只有选中候选模板时再按 ID 获取完整内容。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复

## 修改文件

- plugins/canvasight/mcp/server.mjs
- plugins/canvasight/shared/types.ts
- plugins/canvasight/src/App.tsx
- plugins/canvasight/src/components/RightDrawer.tsx
- plugins/canvasight/src/lib/canvasightApi.ts
- plugins/canvasight/src/lib/translations.ts
- plugins/canvasight/src/styles/app.css
- plugins/canvasight/tests/mcp-smoke.mjs
- plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
- plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md
- README.md
- design.md
- AGENTS.md

## 验证方式

- npm run typecheck
- npm run test:mcp
- npm run build
- plugin validate
- skill quick validate
- Playwright browser-visible verification

## 后续风险

模板摘要目前使用确定性截断，不调用 AI 生成语义摘要；后续如果需要更高质量检索，可以增加本地索引或用户触发的摘要刷新。
