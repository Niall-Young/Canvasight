---
status: resolved
report_type: issue
owner: main-thread
created_by: product-agent
priority: high
created_at: 2026-07-05 22:11
updated_at: 2026-07-05 22:26
related_files:
  - plugins/canvasight/src/components/SettingsDialog.tsx
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/skills/
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - README.md
  - design.md
solution_report: agent-reports/resolved/20260705-2226-development-solution-agent-team-skill-toggle.md
---

# Agent Team skill 与设置开关

## TL;DR

Canvasight 需要新增一个 Agent Team skill，并在设置里提供默认开启的 Agent Team 开关。开启后 Run 输出应携带 Agent Team + agent-report 协作协议；关闭后不输出该协议。Skill 要按需创建角色，不强制所有任务全量启动 Agent。

## 发现者

Product Agent

## 提交 Agent

Product Agent

## 建议交接 Agent

Development Agent、Skill Expert Agent、Customer Support Agent、Test Supervisor Agent

## 问题描述

用户希望把当前项目实践中的 Agent Team 和 agent-report 文件系统协作协议沉淀为 Canvasight skill，并通过 Scatter 设置开关启用/关闭。用户提供 wolai 文章《我把 Agent team 思路写进 Codex》作为依据。

## 现象

- 当前 Canvasight Run Markdown 只输出任务上下文，没有说明是否启用 Agent Team。
- 当前 `await_canvasight_run` structuredContent 没有 Agent Team 字段。
- 当前插件 skills 没有专门描述 Agent Team / agent-report 协议的 skill。
- 设置里没有 Agent Team 开关。

## 复现方式

1. 打开 Canvasight。
2. 点击设置。
3. 观察只有主题和语言等基础设置，没有 Agent Team 开关。
4. 运行节点，观察 Markdown 和 structuredContent 没有 Agent Team / agent-report 协作协议。

## 影响范围

- Canvasight 设置对话框。
- Run Markdown 生成。
- Browser run payload 和 MCP `await_canvasight_run` 返回结构。
- Canvasight plugin skills。
- README。
- smoke test / typecheck / build / plugin validation。

## 证据

- `plugins/canvasight/src/lib/markdown.ts` 当前没有 Agent Team section。
- `plugins/canvasight/mcp/server.mjs` 当前 `normalizeRunPayload` 会丢弃未知字段。
- wolai 文章强调 `AGENTS.md` 定义角色、`agent-report/` 作为交接层、状态目录、frontmatter、固定模板和回写闭环。

## 初步归因

Agent Team 目前是项目内部工作流，还没有成为 Canvasight 可配置的 Run 输出协议，也没有以独立 skill 的形式暴露给 Codex。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 新 skill 应该如何命名和拆分 references？
- Agent Team 开关应存在哪个设置模型里？
- 开启后 Markdown 和 structuredContent 应输出哪些字段？
- “按需创建 Agent”的角色分类与触发规则如何表达？
- README 是否需要同步说明？

## 相关文件

- `plugins/canvasight/src/components/SettingsDialog.tsx`
- `plugins/canvasight/src/lib/markdown.ts`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/skills/`
- `README.md`

## 期望结果

- 设置里新增 Agent Team 开关，默认开启。
- 开启时 Run Markdown 包含 Agent Team 协作协议摘要和按需角色选择规则。
- 关闭时 Run Markdown 不包含 Agent Team 协议。
- `await_canvasight_run` structuredContent 返回 `agentTeam.enabled` 和相关协议字段。
- 新增 Canvasight skill，用于指导 Codex 按需使用 Agent Team 和 agent-report。
- README 中英文说明同步。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已实现 Agent Team 设置开关、Run Markdown / structuredContent 协议、新 `canvasight-agent-team` skill、README / design.md 同步和 MCP smoke 覆盖。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/lib/markdown.ts`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/SettingsDialog.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/skills/canvasight-agent-team/`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`
- `design.md`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- 内置浏览器验证设置对话框默认开启、关闭后重开仍关闭、恢复开启后重开为开启。

## 后续风险

- Agent Team role 推荐基于节点文本关键词，是 v1 启发式分类；后续可根据真实 Run 样本继续调优。
- 当前 structuredContent 在关闭时仍返回 `agentTeam.enabled: false`，这是稳定契约设计，不代表协议仍启用。
