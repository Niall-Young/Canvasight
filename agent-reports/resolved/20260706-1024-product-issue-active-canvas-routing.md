---
status: resolved
report_type: issue
owner: Product Agent
created_by: main-thread
priority: high
created_at: 2026-07-06 10:24
updated_at: 2026-07-06 10:35
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/skills/canvasight/SKILL.md
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-graph-writer/SKILL.md
  - README.md
  - design.md
solution_report: agent-reports/resolved/20260706-1035-development-solution-active-canvas-routing.md
---

# 已开启画布后的任务路由缺口

## TL;DR

Canvasight 画布已经开启后，Codex 对后续中大型需求仍容易按普通任务直接执行，而不是优先判断是否应写入画布节点和连线。

## 发现者

user

## 提交 Agent

main-thread

## 建议交接 Agent

Product Agent, Development Agent, Skill Expert Agent, Test Supervisor Agent

## 问题描述

用户期望开启 Canvasight 画布后，后续“我要做什么”的自然语言需求默认优先考虑画布承接，尤其是产品规划、代码架构分析、文章结构梳理、多步骤任务拆解等场景。当前 Skill 触发描述和 `open_canvasight` 返回文案更多强调打开网页，没有把“Canvasight 已 active 时优先建图”的行为放进可被 Codex 稳定消费的上下文。

## 现象

用户开启画布后继续描述需求，Codex 仍可能像没有 Canvasight 一样直接开始修改代码或回答任务，没有先调用 `write_canvasight_graph` 创建或更新画布。

## 复现方式

1. 调用 `open_canvasight` 打开某项目画布。
2. 在同一线程继续说“我想做一个产品/分析这个代码库/梳理这篇文章”。
3. 观察 Codex 是否优先考虑 `write_canvasight_graph`，还是直接执行普通任务。

## 影响范围

影响 Canvasight 作为“网页画布 + 输出给 Codex”的核心体验，尤其影响 AI 生成画布、模板复用、项目 Page 和后续 Run 工作流。

## 证据

- `open_canvasight` 当前只返回“Open this URL in the Codex in-app browser sidebar”。
- `canvasight-graph-writer` frontmatter 只覆盖用户显式要求“生成节点/写图”的场景，不覆盖“画布已开启后的自然需求承接”。
- README 已介绍 AI 生成画布，但没有说明“已开启画布时”的优先策略。

## 初步归因

Skill 触发面和 MCP tool result 缺少 active canvas routing contract，导致新请求没有稳定的上下文提示去优先选择 Canvasight 图写入路径。

## 交付给哪个 Agent

Product Agent, Development Agent, Skill Expert Agent, Test Supervisor Agent

## 需要回答的问题

- 哪些任务在 Canvasight active 时应优先进入画布？
- 哪些任务仍应直接执行，避免过度打断？
- MCP 返回、tool description、Skill frontmatter、README/design 是否都需要同步？
- 如何用 smoke test 验证新 contract？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-graph-writer/SKILL.md`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`
- `design.md`

## 期望结果

Canvasight 打开后，tool result 与 Skill 元数据都能让 Codex 稳定理解：对中大型结构化需求，应先考虑写入或更新 Canvasight 画布；对简单命令、直接问答或用户明确要求立即执行的任务，不强制使用画布。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。`open_canvasight` / `open_canvasight_recent_project` 现在返回 `activeCanvasRouting` / `canvasRouting`，让 Codex 在画布已开启后对中大型结构化需求优先考虑 `write_canvasight_graph`；Skill 和文档也同步了“优先考虑但不强制”的边界。

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
- Skill quick validation
- Plugin validation
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`

## 后续风险

已开启画布后的“优先考虑画布”仍依赖 Codex 使用 tool result / Skill 元数据进行路由；已通过结构化字段和 frontmatter 降低漏触发风险。用户明确要求直接执行、小任务和 Run payload 仍应走原路径，避免过度画布化。
