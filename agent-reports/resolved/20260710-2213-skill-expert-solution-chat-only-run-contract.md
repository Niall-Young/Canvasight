---
status: resolved
report_type: solution
owner: Skill Expert Agent
created_by: Skill Expert Agent
priority: medium
created_at: 2026-07-10 22:13
updated_at: 2026-07-10 22:13
related_issue:
related_files:
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - plugins/canvasight/skills/canvasight/SKILL.md
---

# 节点 Run 改为仅 Chat 的 Skill 合同

## 负责 Agent

Skill Expert Agent

## 对应问题

用户要求从节点移除 Plan 与 Goal，避免不能由 Desktop host 真实切换模式时的错误与假阳性。

## Root Cause

Run skill 仍将 Chat、Plan、Goal 作为可选节点模式，包含不可用原生模式控制的阻断说明，与新的 Chat-only 节点契约冲突。

## 调研过程

检查 `canvasight-run` 与其输出合同，确认旧文档和排队 payload 仍可能带有 `codexMode` 或 `planMode`。

## 可选方案

- 保留 Plan/Goal 并继续阻断。
- 将节点 Run 收敛为 Chat，并兼容读取旧字段。

## 推荐方案

采用 Chat-only：发送路径与当前 Desktop host bridge 能力一致，同时不丢失旧节点的 Markdown。

## 实施步骤

1. 将 Run skill 的触发描述与正文改为 Chat-only。
2. 删除 Plan/Goal 原生模式确认和错误语义。
3. 规定旧 `codexMode: plan|goal` 或 `planMode: true` 一律归一为 Chat。
4. 更新 Canvasight 索引与队列记录。

## 风险与回滚

旧字段不再触发 Plan/Goal 语义；保留字段读取与 Markdown，可在未来重新引入有宿主 API 支持的模式控制。

## 处理结果

已修复

## 修改文件

- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `agent-reports/QUEUE.md`

## 验证方式

- 运行 Skill Creator `quick_validate.py` 验证 Run skill frontmatter 与目录结构。
- 搜索确认 Run skill 不再包含 Plan/Goal 模式执行或阻断合同。

## 后续风险

无；若未来 Desktop host 提供可验证的模式切换 API，需要以新产品需求重新设计节点模式与 Skill 合同。
