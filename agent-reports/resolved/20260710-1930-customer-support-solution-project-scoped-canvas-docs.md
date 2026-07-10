---
status: resolved
report_type: solution
owner: Customer Support Agent
created_by: Customer Support Agent
priority: high
created_at: 2026-07-10 19:30
updated_at: 2026-07-10 19:30
related_issue: user-reported-project-scoped-scatter-routing
related_files:
  - README.md
---

# 项目级 `.scatter` 与当前任务 Run 文档

## 负责 Agent

Customer Support Agent

## 对应问题

用户反馈切换项目后仍看到同一画布和同一 Run / Plan thread-store 错误，并重申 Canvasight 的内容必须随项目文件夹中的 `.scatter` 保存。

## Root Cause

既有 README 分别描述了 `.scatter` 数据存储和“发送到当前 Codex 任务”，但没有明确两者是独立绑定，也没有禁止最近项目或旧任务状态覆盖当前任务所解析的项目目录。用户因此无法从文档判断这是实现缺口，而非预期行为。

## 调研过程

按项目规则检查了 `AGENTS.md`、`design.md`、`plugins/canvasight/package.json`、`plugins/canvasight/mcp/server.mjs` 和全部 `plugins/canvasight/skills/*/SKILL.md`。README 的数据存储和 Run 条目存在，但缺少跨项目切换的明确合同。

## 可选方案

- 方案 A：仅保留现有“当前任务”与数据存储的分散说明。
- 方案 B：在中英文 README 中明确项目画布、临时 `threadId`/Run 和最近项目记录的边界。

## 推荐方案

采用方案 B。它与项目“画布文件跟随项目目录”的产品合同一致，也明确了需要由运行时修复的行为，避免将旧 thread-store 故障误解释为项目切换成功。

## 实施步骤

1. 在中英文产品说明和基础用法中说明：当前任务解析项目目录并加载该目录的 `.scatter`。
2. 在中英文数据存储段落中限制 `threadId` 和最近项目记录的职责。

## 风险与回滚

文档变更不改变运行时。若运行时未落实该合同，README 不应被视为验证通过；可回滚本次 README 与报告改动。

## 处理结果

已完成用户可见合同澄清；运行时实现和验证由 Development / Test Supervisor 负责。

## 修改文件

- `README.md`
- `agent-reports/resolved/20260710-1930-customer-support-solution-project-scoped-canvas-docs.md`
- `agent-reports/QUEUE.md`

## 验证方式

- 检查中文与英文均明确 `.scatter` 项目归属、当前任务 Run 路由和最近项目不覆盖当前项目的边界。

## 后续风险

必须以真实跨项目打开和 native Run 验证运行时确实重新解析当前任务项目目录，且不会复用旧 threadId / project binding。
