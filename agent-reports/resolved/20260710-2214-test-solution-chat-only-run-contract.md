---
status: resolved
report_type: solution
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
created_at: 2026-07-10 22:14
updated_at: 2026-07-10 22:18
related_issue:
related_files:
  - plugins/canvasight/tests/markdown-flow-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Chat-only Run 回归覆盖

## 负责 Agent

Test Supervisor Agent

## 对应问题

用户要求从节点中移除 Plan 与 Goal，旧画布和旧请求不得再触发原生模式控制。

## Root Cause

既有 smoke 测试将 Plan/Goal 当作可执行节点模式，并断言宿主模式控制的阻断行为；这会把已移除的能力继续固化为产品契约。

## 推荐方案

将所有 Run 断言收敛为 Chat；保留 `plan`、`goal` 和 `planMode: true` 的输入夹具，仅用于验证安全归一化为 Chat。

## 实施步骤

1. Markdown smoke 使用旧 Plan 节点，断言不再输出执行模式元数据。
2. MCP smoke 覆盖旧节点、图写入、模板和 widget/bare Run payload 归一化为 Chat。
3. 移除 Plan/Goal 原生模式阻断断言，断言不会调用 `thread/goal/set` 或 Plan settings。

## 处理结果

测试契约已调整；legacy Plan/Goal 节点与请求会移除已废弃字段，Run 输出以 Chat-only 语义处理。

## 修改文件

- `plugins/canvasight/tests/markdown-flow-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run test:markdown` 通过。
- `npm run test:mcp` 通过。

## 后续风险

如果持久化归一化遗漏任一入口，新的 legacy 输入断言会失败；此为预期回归保护。
