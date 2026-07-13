---
schema_version: 1
report_id: issue-agent-team-default-off
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T08:03:59Z
updated_at: 2026-07-13T08:08:40Z
depends_on: []
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/tests/markdown-flow-smoke.mjs
  - design.md
verification_status: passed
verification_evidence:
  - Markdown smoke covers default disabled and explicit opt-in behavior.
  - Typecheck, production build, MCP bundle check, and plugin validation pass.
  - Browser verification confirms default off, explicit opt-in persists after reload, and Restore Defaults returns to off.
solution_report: solution-agent-team-default-off
---

# Agent Team 默认开启会额外消耗用户 Token

## TL;DR

Agent Team 已改为默认关闭；只有严格的布尔值 `true` 才会开启高成本协作协议。

## 问题描述

`defaultAppSettings.agentTeamEnabled` 与 `buildMarkdown` 的缺省参数原本都是 `true`，让未配置用户的 Run 自动附带 Agent Team 协议，并可能触发多 Agent 协作与报告流程。

## 处理结果

- 新用户、旧设置缺字段与异常非布尔值均默认关闭。
- 已显式保存为 `true` 或 `false` 的用户选择保持不变。
- 默认 Run Markdown 不再包含 Agent Team 协议；显式开启后仍完整输出。
- “恢复默认”会回到关闭。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/markdown.ts`
- `plugins/canvasight/tests/markdown-flow-smoke.mjs`
- `design.md`
- 构建产物与 Agent Team 报告文件。

## 验证方式

- `npm --prefix plugins/canvasight run test:markdown`
- `npm --prefix plugins/canvasight run typecheck`
- `npm --prefix plugins/canvasight run build`
- `npm --prefix plugins/canvasight run check:mcp-bundle`
- 插件校验脚本。
- 浏览器可见设置与刷新持久化检查。

## 后续风险

- 设置持久化目前依赖浏览器验收，尚无独立自动化 UI 测试。
- 全仓 Agent Team validator 仍被既有 legacy 报告与旧模板 schema 债务阻断；本轮新报告使用当前 schema。

## Closure Criteria

- [x] 默认设置与 Markdown 缺省参数都改为关闭。
- [x] 增加覆盖默认关闭及显式开启的回归测试。
- [x] `design.md` 与实际行为一致。
- [x] 类型检查、Markdown 测试、构建与浏览器可见验证通过。
- [x] README 已审查；现有“可选”中英文描述准确，无需更新。
