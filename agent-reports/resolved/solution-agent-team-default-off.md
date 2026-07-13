---
schema_version: 1
report_id: solution-agent-team-default-off
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T08:08:40Z
updated_at: 2026-07-13T08:08:40Z
depends_on:
  - issue-agent-team-default-off
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/tests/markdown-flow-smoke.mjs
  - design.md
verification_status: passed
verification_evidence:
  - Default Markdown omits Agent Team while explicit true includes it.
  - Browser Settings switch is off by default and explicit true persists after reload.
---

# Agent Team 默认关闭解决方案

## Root Cause

共享设置和 Markdown API 各自拥有默认开启值，导致缺少用户配置时自动启用高成本 Agent Team 协作。

## 解决方案

- 将共享设置和 Markdown API 的缺省值都设为 `false`。
- 设置归一化只接受严格布尔值 `true` 作为 opt-in，缺字段与异常旧值安全关闭。
- 保留已有设置开关和 localStorage 持久化链路，不强制覆盖用户已保存的布尔选择。
- 增加默认关闭与显式开启两条 Markdown 回归断言。
- 同步 `design.md` 的产品默认边界。

## 验证结果

Markdown smoke、TypeScript、production build、MCP bundle freshness 和 plugin validation 均通过。浏览器确认默认关闭、开启后刷新仍开启、恢复默认后关闭。

## 风险与回滚

设置持久化缺少独立自动化 UI 测试，但浏览器验收已覆盖关键路径。回滚只需恢复两个默认值与设计基线，不涉及持久化结构迁移。
