---
schema_version: 1
report_id: solution-agent-team-only-agents-guidance
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T07:31:10Z
updated_at: 2026-07-14T07:31:10Z
depends_on:
  - issue-agent-team-only-agents-guidance
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - Managed-only AGENTS.md produces exactly one AGENTS guidance node with dedicated copy.
  - Managed plus substantive project guidance produces no duplicate node.
---

# 用 AGENTS.md 内容状态替代单纯文件存在检查

## Root Cause

项目指导去重只检查 `AGENTS.md` 是否存在，没有区分“只有 Canvasight 受管协议”和“已有项目通用规则”。

## 解决方案

- 增加 `missing`、`agent-team-only`、`present` 三态检查。
- 只在完整 start/end 受管标记成对存在时剥离该区间进行判断；异常标记和读取失败保持保守存在语义。
- missing 使用创建文案；agent-team-only 使用“完善 AGENTS.md”及保留受管段的专用正文。
- `projectHasGuidanceFile()` 复用同一状态，使节点注入和 framework validation 不分叉。

## 验证结果

Build 与 MCP smoke 通过；三态矩阵、节点标题、正文约束和去重均有自动化覆盖。

## 风险与回滚

回滚会恢复“文件存在即完整”的误判。实现不会自动编辑目标项目文件，只影响指导节点生成。
