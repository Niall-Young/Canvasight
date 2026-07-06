---
status: resolved
report_type: solution
owner: Development Agent
created_by: main-thread
priority: high
created_at: 2026-07-06 10:35
updated_at: 2026-07-06 10:35
related_issue: agent-reports/resolved/20260706-1024-product-issue-active-canvas-routing.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight/SKILL.md
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - README.md
  - design.md
  - AGENTS.md
---

# Active Canvas 路由方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1024-product-issue-active-canvas-routing.md`

## Root Cause

Canvasight 已经具备 `write_canvasight_graph` 能力，但 `open_canvasight` 只返回打开 URL 的提示，Skill frontmatter 也主要覆盖用户显式要求“生成 Canvasight 节点/图”的场景。画布打开后的后续自然需求没有稳定的 active canvas context 信号。

## 调研过程

- Product Agent 确认：中大型、结构化、跨阶段需求应优先考虑画布；简单命令、Run payload 和明确直接执行的请求不应强制进画布。
- Skill Expert Agent 确认：无需新增 Skill，应扩展 `canvasight` 与 `canvasight-graph-writer` 的触发描述，并保持 body 简短。
- Development Agent 确认：应在 `open_canvasight` / `open_canvasight_recent_project` 返回中加入机器可读路由字段，同时更新 tool description。
- Test Supervisor Agent 确认：MCP smoke 需要覆盖 tool description、active routing 字段、版本一致性和默认不打开系统浏览器的环境隔离。
- Design Agent 确认：机制应停留在 Codex/MCP/Skill 层，避免在可读文案中过度暴露内部工具名。
- Customer Support Agent 确认：README 中英文需要同步说明 active canvas context，并把英文强制语气改成“considered for graph-first Page handling”。

## 可选方案

- 方案 A：只改 README / Skill 文案。
- 方案 B：只改 MCP 返回。
- 方案 C：MCP 结构化字段、tool description、Skill frontmatter、README/design/AGENTS 和 smoke test 同步更新。

## 推荐方案

采用方案 C。它同时覆盖运行时上下文、技能触发面、用户文档、设计边界和测试约束，并保持 UI 不变。

## 实施步骤

1. 新增 `canvasRoutingContext()`，在 `open_canvasight` 返回 `activeCanvasRouting` / `canvasRouting`。
2. 更新 `open_canvasight`、`open_canvasight_recent_project`、`write_canvasight_graph` 的 tool description。
3. 更新 `canvasight` 与 `canvasight-graph-writer` frontmatter，让 active canvas 后续中大型需求可触发图写入路径。
4. 在 `canvasight-open` 和 graph-writer references 中补充 active canvas 边界。
5. README 中英文、`design.md`、`AGENTS.md` 同步记录“优先考虑但不强制”的边界。
6. 插件版本从 `0.1.14` bump 到 `0.1.15`。
7. MCP smoke 增加 active routing、tool description、版本一致性和环境隔离断言。

## 风险与回滚

风险：Codex 是否优先用画布仍取决于工具结果和 Skill 元数据是否被新线程加载。回滚方式：恢复 `server.mjs` 的 routing 字段和 Skill/frontmatter 文案，并将版本回退或继续 bump 出修复版本。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md`
- `README.md`
- `design.md`
- `AGENTS.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run test:mcp`
- `npm run typecheck`
- `npm run build`
- `npm run test:dev-server`
- Skill quick validation for `canvasight`, `canvasight-open`, and `canvasight-graph-writer`
- Plugin validation
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`

## 后续风险

已安装插件 cache 已刷新到 `0.1.15`，但已经打开的 Codex thread 仍可能需要 reload 或新开线程才能获得新的 Skill/MCP metadata。
