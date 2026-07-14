---
schema_version: 1
report_id: solution-agents-md-guidance-agent-team-opt-in
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: medium
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-14T06:19:39Z
updated_at: 2026-07-14T06:19:39Z
depends_on:
  - issue-agents-md-guidance-agent-team-opt-in
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - MCP smoke passed with an exact AGENTS.md guidance-body assertion.
  - MCP bundle freshness check passed.
---

# AGENTS.md 指导节点保持 Agent Team opt-in

## Root Cause

通用 software-product 指导节点使用固定正文，生成路径没有 Agent Team 设置上下文；旧正文却把“Agent Team 分工”列为必写内容。

## 解决方案

- 将正文改为通用项目治理约束。
- 明确 Agent Team 等可选流程只有启用后才应加入。
- 用完整字符串断言锁定节点说明，避免以后重新引入肯定式 Agent Team 要求。
- 按 MCP 用户可见运行时变更规则同步版本 `0.4.18` 并重建 bundle。

## 验证结果

MCP smoke、production build 与 bundle freshness 均通过。此变更不涉及 UI、Widget host 或设置持久化。

## 风险与回滚

风险仅限指导文案语义；回滚可恢复单一常量与测试断言，不涉及文档格式或持久化迁移。
