---
status: resolved
report_type: solution
owner: Customer Support Agent
created_by: Customer Support Agent
priority: medium
created_at: 2026-07-10 19:56
updated_at: 2026-07-10 19:56
related_issue:
related_files:
  - README.md
---

# Desktop Plan / Goal 用户文档

## 负责 Agent

Customer Support Agent

## 对应问题

本轮 Plan / Goal Desktop 直连与安全回退实现。

## Root Cause

README 只说明了 thread-store 预检失败后的旧恢复方式，未解释 Desktop 优先连接、stdio 回退、精确 task 绑定和可见诊断。

## 调研过程

检查了 `AGENTS.md`、`design.md`、插件包与 MCP runtime，以及全部 Canvasight skills。现有文档已承诺 Plan/Goal 预检失败不得发送；本轮需要补全新的用户可见通道与边界。

## 可选方案

- 仅在内部诊断中暴露通道信息。
- 在中英文 FAQ 中说明行为、失败边界与恢复方式。

## 推荐方案

更新双语 FAQ：Desktop 优先、stdio 安全回退、只恢复 widget 绑定 task、成功预检后才发送，以及诊断与禁止 UI 自动化的边界。

## 实施步骤

1. 更新中文 thread-store 故障 FAQ。
2. 同步等义英文说明。

## 风险与回滚

文档描述依赖本轮 runtime 实现。若实现的诊断字段或回退条件变化，应同步修订 README；回滚时恢复本次 FAQ 文本。

## 处理结果

已更新文档，待主线程将其与 runtime 及测试一并验证。

## 修改文件

- `README.md`

## 验证方式

- 对照 MCP 的 Plan/Goal preflight 实现与 Canvasight Run skill，确认双语说明保留“成功预检前不发送”和“仅当前 task”的合同。

## 后续风险

真实 Codex Desktop 原生宿主验收仍由主线程执行；文档更新本身不能证明该通道可用。
