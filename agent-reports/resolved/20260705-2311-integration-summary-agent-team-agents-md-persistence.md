---
status: resolved
report_type: integration-summary
owner: Main thread
created_by: Main thread
priority: high
created_at: 2026-07-05 23:11
updated_at: 2026-07-05 23:11
related_files:
  - agent-reports/resolved/20260705-2311-product-issue-agent-team-agents-md-persistence.md
  - agent-reports/resolved/20260705-2311-development-solution-agent-team-agents-md-persistence.md
solution_report:
agent_id:
---

# 集成总结：Agent Team AGENTS.md 默认持久化

## 已解决

- Agent Team 实际启用时，MCP server 会在 Run 入队前检查目标项目 `AGENTS.md`，缺失时创建，已有但缺少协议时追加最小 Agent Team 段落。
- 使用 `<!-- canvasight-agent-team:start/end -->` 哨兵块，重复 Run 返回 `unchanged`，不会重复追加。
- `structuredContent.agentTeam.agentsMd` 会返回 `created`、`appended`、`updated`、`unchanged`、`skipped` 或 `failed`，供 Codex 判断是否可以继续角色工作。
- 新规则说明这是跨 Codex thread 延续固定 Agent Team 工作方式的必要持久层。
- 保留安全边界：不覆盖已有项目规则；明确禁止或冲突时先写 issue/risk report 并询问。
- README 中英文 FAQ 已同步。
- 插件版本提升到 `0.1.10`。

## Agent 调用记录

- Product Agent：复用 `019f31ba-5e18-7f33-a7c2-189dd10f0129`，负责产品边界确认。
- Skill Expert Agent：复用 `019f31ba-7353-7271-91f2-f0b7e9d1d2fe`，负责 skill wording 方向。
- Development Standards Lead：复用 `019f31ba-6cb5-76a1-8626-449964f8c6b4`，负责 `AGENTS.md` 最小持久化规则。
- Test Supervisor Agent：复用 `019f31ba-64eb-7a71-8e9d-55d19d37c18d`，要求补充文件态验证和 MCP smoke bootstrap 覆盖；已落实。
- Project Management Agent：复用 `019f31ba-6008-7a52-9ef2-bf004df77ba2`，确认不需要拆 commit，提交名 `fix: 持久化 Agent Team 项目规则` 合理。
- Customer Support Agent：当前上下文未暴露独立固定 agent，由主线程按 README checklist 执行。

## 验证计划

- `npm run typecheck`
- `npm run test:mcp`
  - 缺失 `AGENTS.md` 时创建并返回 `created`
  - 已有 `AGENTS.md` 时追加并返回 `appended`
  - 重复 Run 不重复追加并返回 `unchanged`
  - 关闭 Agent Team 时不写入并返回 `skipped`
- `npm run build`
- plugin validate
- skill quick validate
- `git diff --check`
- `rg` 文案覆盖检查

## 未解决

- 无当前阻断。

## 下一轮分派

- 如果真实 Run 中 `agentTeam.agentsMd` 返回 `failed`，交给 Development Standards Lead 和 Test Supervisor Agent 复现具体文件系统错误。
