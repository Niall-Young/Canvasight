---
status: resolved
report_type: solution
owner: Customer Support Agent
created_by: Customer Support Agent
priority: high
created_at: 2026-07-10 21:42
updated_at: 2026-07-10 21:42
related_issue: current Desktop host Plan / Goal acknowledgement gap
related_files:
  - README.md
---

# 原生 Plan / Goal 回执文档

## 负责 Agent

Customer Support Agent

## 对应问题

Canvasight 能经由 native host bridge 发送内容，但该投递并不证明 ChatGPT Desktop 已把当前任务切换到 Plan 或 Goal。

## Root Cause

README 将 bridge Promise 的投递成功描述为 native Run 成功；它没有明确区分消息送达与 Desktop 原生模式切换，也没有说明当前 host 缺失该模式切换回执时的严格阻断行为。

## 调研过程

按 AGENTS.md 核对 `design.md`、插件 package manifest、MCP server 和所有 Canvasight skills；核对 agent-reports/QUEUE.md 与已完成的 Desktop runtime 兼容性文档。当前用户截图证明普通 follow-up 可送达，但没有 Desktop Plan 状态变化证据。

## 可选方案

- 将 app-server/bridge 请求成功视为 Plan 或 Goal 成功。
- 仅在 Desktop host 明确确认当前 task 原生模式已切换后发送 Plan / Goal 内容。

## 推荐方案

采用严格确认：消息投递与模式切换分开说明；当前 host 未暴露确认时，Plan / Goal 保留内容并阻断，用户可明确改选 Chat。

## 实施步骤

1. 修正双语功能和使用说明，区分 Chat 发送与 Plan / Goal 的确认门槛。
2. 扩展 native Run 合同，明确 bridge Promise 不足以确认 Plan / Goal。
3. 增加双语 FAQ，解释“已发送但未进入 Plan”的原因和当前阻断行为。

## 风险与回滚

文档必须与运行时严格门控保持一致；若 Desktop 后续提供可靠的模式切换回执，可将 FAQ 改为该回执的具体可见证据。

## 处理结果

已补充双语说明：没有 Desktop 原生模式确认时，Canvasight 不得声称或发送 Plan / Goal Run。

## 修改文件

- `README.md`

## 验证方式

- 核对中文和 English 功能说明、基础用法、native widget 合同与 FAQ 都区分了“已送达”和“模式已切换”。
- 未加入开发命令或承诺当前 host 不具备的能力。

## 后续风险

需要由 Development 与 Test Supervisor 把这个确认门槛落实到实际 Plan / Goal Run，并在真实 Desktop host 上验证：无回执时不发送，有回执时模式与内容都到达同一任务。
