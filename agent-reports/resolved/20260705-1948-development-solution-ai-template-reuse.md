---
status: resolved
report_type: solution
owner: development-agent
created_by: development-agent
priority: medium
created_at: 2026-07-05 19:48
updated_at: 2026-07-05 19:48
related_issue: agent-reports/resolved/20260705-1941-product-issue-ai-template-reuse.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md
  - plugins/canvasight/skills/canvasight-graph-writer/references/graph-types.md
  - README.md
---

# AI 写图复用全局节点模板解决方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260705-1941-product-issue-ai-template-reuse.md`

## Root Cause

Canvasight 已有全局节点模板存储和网页拖拽复用能力，但 MCP 写图协议只接收节点输入并写入 `.scatter/scatter.json`，没有给 AI 暴露模板列表，也没有在节点归一化时合并模板标题、正文和附件。

## 调研过程

- 确认 `readNodeTemplates()` / `createNodeTemplate()` 已在 `plugins/canvasight/mcp/server.mjs` 中存在。
- 确认网页侧模板只保存 `title`、`body`、`attachments`，不保存 Chat / Plan / Goal。
- 确认 `normalizeGraphNode()` 是写图时生成节点数据的统一入口，适合放入模板复用逻辑。
- 确认 `graphType` 和 Page 写入 `mode` 不应被模板影响。

## 可选方案

- 方案 A：只改 skill，让 AI 自己读模板文件。缺点是暴露本地存储细节，且 MCP contract 不可验证。
- 方案 B：新增 MCP 列表工具，并让 `write_canvasight_graph` 支持 `templateId` / `templateQuery`。优点是能力可发现、可测试、对旧调用兼容。
- 方案 C：把模板库复制到每个项目。缺点是破坏“全局模板”语义，且和当前网页拖拽复用不一致。

## 推荐方案

采用方案 B。AI 先调用 `list_canvasight_node_templates` 扫描模板，匹配后在节点输入里传 `templateId`；`write_canvasight_graph` 在 MCP 层复用模板标题、正文和附件，并在返回结构里记录 `reusedTemplates`。

## 实施步骤

1. 新增模板查询 helper 和 `list_canvasight_node_templates` MCP tool。
2. 扩展 `normalizeGraphNode()` 支持 `templateId`、`templateQuery` 和标题精确匹配兜底。
3. `write_canvasight_graph` 默认启用模板复用，可用 `reuseTemplates: false` 关闭。
4. MCP 返回新增 `reusedTemplates`，summary 显示复用数量。
5. `mcp-smoke` 增加模板列表、`templateId` 复用、`templateQuery` 复用、附件继承断言。
6. 更新 `canvasight-graph-writer` skill 和中英文 README。
7. MCP runtime 版本从 `0.1.4` 升到 `0.1.5`。

## 风险与回滚

- 风险：旧 Codex 线程可能仍使用旧插件缓存，看不到新 tool。需要重装插件并新开或 reload 线程。
- 风险：`templateQuery` 是 best-effort 搜索，低置信时可能不命中。推荐 AI 优先使用 `templateId`。
- 回滚：撤回 `server.mjs` 的新 tool 和模板合并逻辑，并把版本恢复到上一版。

## 处理结果

已修复。

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

- 当前附件复用沿用全局模板附件引用，不复制到项目资产。若未来需要项目可完全独立迁移，应新增独立的模板附件 materialize 流程。
