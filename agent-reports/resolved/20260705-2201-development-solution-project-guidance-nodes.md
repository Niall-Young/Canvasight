---
status: resolved
report_type: solution
owner: development-agent
created_by: integration-main
priority: medium
created_at: 2026-07-05 22:01
updated_at: 2026-07-05 22:01
related_issue: agent-reports/resolved/20260705-2153-product-issue-project-guidance-nodes.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-graph-writer/references/graph-types.md
  - README.md
---

# 缺失项目规范文档节点解决方案

## 负责 Agent

Development Agent

## Root Cause

`software-product` 的 `AGENTS.md` / `design.md` 规则之前只存在于生成策略描述里，没有在 MCP `write_canvasight_graph` 层形成确定性行为。同时文档中的 “missing or incomplete” 会把需求误导成内容质量审计，而用户要求是只判断文件是否存在。

## 调研过程

- Product Agent 明确规则：只在根目录缺文件时创建对应节点，文件存在时不判断内容。
- Test Supervisor Agent 要求覆盖两个都缺、两个都存在、只缺一个、非 `software-product` 不触发。
- Skill Expert Agent 指出 `graph-types.md` 和 README 的 “missing or incomplete” 必须改成存在性判断。
- Customer Support Agent 判断 README 需要同步更新中英文说明。
- Project Management Agent 建议提交范围聚焦在写图策略、测试、README、skill 文档和版本号。

## 可选方案

- 方案 A：只改 skill 文档，让 AI 自行生成节点。
- 方案 B：在 MCP 写图层兜底追加缺失文档节点，并让 skill 文档保持一致。
- 方案 C：直接创建真实 `AGENTS.md` / `design.md` 文件。

## 推荐方案

采用方案 B。它符合“创建这个节点”的要求，也避免超出范围去写真实项目文件。MCP 层会根据目标项目根目录存在性追加节点，AI 生成策略和 README 只描述这个稳定合同。

## 实施步骤

- 在 `server.mjs` 增加 `SOFTWARE_PRODUCT_GUIDANCE_FILES` 配置。
- 在构建 graph page 时检查目标项目根目录是否存在 `AGENTS.md` / `design.md`。
- 缺文件时追加 `补充 AGENTS.md` / `补充 design.md` 节点，并从首个节点自动连接过去。
- 只在第一页、`graphType: "software-product"` 时触发。
- 对明确已有补文档意图的输入节点做去重，避免重复补同一文档节点。
- 在 `structuredContent.projectGuidanceNodes` 返回自动补的文档节点信息。
- 将插件版本提升到 `0.1.6`。
- 更新 MCP smoke、README 和 graph-writer skill 参考文档。

## 风险与回滚

- 风险：自动追加节点会改变 `software-product` 图的节点和边数量；已通过 smoke 覆盖。
- 风险：大小写文件名可能被误判；实现把 `AGENTS.md` / `agents.md` / `Agents.md` 视为同一个文件，`design.md` / `DESIGN.md` / `Design.md` 视为同一个文件。
- 回滚：移除 `SOFTWARE_PRODUCT_GUIDANCE_FILES` 和 `softwareProductGuidanceNodes` 调用，并恢复版本号与 smoke 断言。

## 验证方式

- `npm run test:mcp`
- `npm run typecheck`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-types.md`
- `README.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 后续风险

后续如果要让 AI 审查已有 `AGENTS.md` / `design.md` 内容质量，需要新增独立 graphType 或显式参数，不能混入当前存在性规则。
