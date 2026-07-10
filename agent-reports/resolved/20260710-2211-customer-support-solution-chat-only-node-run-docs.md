---
status: resolved
report_type: solution
owner: Customer Support Agent
created_by: Customer Support Agent
priority: medium
created_at: 2026-07-10 22:11
updated_at: 2026-07-10 22:11
related_issue:
related_files:
  - README.md
---

# 节点 Chat-only Run 文档同步

## 负责 Agent

Customer Support Agent

## 对应问题

用户要求放弃并从节点中移除 Plan 与 Goal，避免继续显示无法由当前 Desktop host 支持的模式。

## Root Cause

README 仍把节点 Run 描述为 Chat、Plan、Goal 三种模式，并保留了 Plan / Goal 的原生模式确认、阻断和恢复说明；这与新的 Chat-only 产品行为冲突。

## 调研过程

检查中英文 README 的主要功能、基本使用、native Run 契约、Skill Split 与 FAQ，确认以上所有区域均包含已废弃的 Plan / Goal 节点模式文案。

## 可选方案

- 方案 A：保留 Plan / Goal 的历史限制说明。
- 方案 B：将用户文档统一为 Chat-only 节点 Run，并删除过时的模式切换 FAQ。

## 推荐方案

采用方案 B：界面和行为移除模式后，用户文档不再暴露不可用的选择或排错路径。

## 实施步骤

1. 将中英文节点能力和操作步骤改为通过 Chat 发送。
2. 将 native Run 契约和 Skill 描述改为 native Chat Run。
3. 删除 Plan / Goal 模式切换 FAQ，并简化 rollout/runtime 故障说明。

## 风险与回滚

旧版本的报告仍保留历史审计记录。若未来 Desktop 提供可验证的模式控制 API，可在恢复界面功能时重新补充对应文档。

## 处理结果

已修复。

## 修改文件

- `README.md`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260710-2211-customer-support-solution-chat-only-node-run-docs.md`

## 验证方式

- 搜索 README，确认不再出现 Plan / Goal 节点模式、模式切换或对应 FAQ。
- 检查中文和英文主要功能、基本使用、native 契约、Skill Split 和 FAQ 均明确为 Chat-only。

## 后续风险

本报告只覆盖用户文档；代码、测试、版本和集成验收由其他角色负责。
