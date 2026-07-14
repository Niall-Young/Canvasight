---
schema_version: 1
report_id: integration-summary-agents-md-guidance-agent-team-opt-in
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: medium
version: 1
agent_id: /root
thread_id: null
created_at: 2026-07-14T06:19:39Z
updated_at: 2026-07-14T06:19:39Z
depends_on:
  - issue-agents-md-guidance-agent-team-opt-in
  - solution-agents-md-guidance-agent-team-opt-in
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - Product, Development, and Test role reviews agree on the scoped correction.
  - MCP smoke, production build, and bundle freshness passed.
---

# AGENTS.md 指导节点 Agent Team 边界集成总结

## 本轮目标

修正未开启 Agent Team 时仍要求在 `AGENTS.md` 中写 Agent Team 分工的错误节点说明。

## Agent 状态与角色决策

- Product Agent：确认这是通用项目治理节点，Agent Team 必须保持 opt-in。
- Development Agent：确认根因是 MCP 静态正文，最小范围无需改 UI、设置或图结构。
- Test Supervisor Agent：确认默认未配置 Agent Team 的 software-product smoke 是真实回归路径，并建议完整正文断言。
- Design Agent：Main Thread 检查；无布局、交互、图标或视觉变化。
- Design Standards Expert：Main Thread 检查；`design.md` 已明确 Agent Team 默认关闭，无需更新。
- Customer Support Agent：Main Thread 检查；正常用户流程与命令未变化，README 无需更新。
- Development Standards Lead：Main Thread 检查；无 durable workflow 变化，`AGENTS.md` 无需更新。
- Skill Expert Agent：Main Thread 按 `canvasight-agent-team` Skill 核对触发边界；Skill 文件无需修改。
- Project Management Agent：重建后执行只读 scoped diff 审查；Main Thread 负责选择性暂存与提交闭环。

## 已完成改动

- 将缺失 `AGENTS.md` 节点改成通用项目规则说明。
- 明确不默认加入未启用的 Agent Team 等可选流程。
- 新增完整正文 MCP smoke 回归。
- 同步版本 `0.4.18` 和自包含 MCP bundle。

## 验证

- `npm run build`：通过，仅有既有 Vite 大 chunk 警告。
- `npm run test:mcp`：通过。
- `npm run check:mcp-bundle`：通过。
- `npm run release:verify -- 0.4.18`：通过。
- plugin validation：通过。
- `git diff --check`：通过。
- 浏览器 / native widget：不适用；本轮只改 MCP 生成节点正文。

## 未解决 / 风险

- 全仓 Agent Team validator 失败：既有 legacy 根报告、旧模板与 QUEUE schema 债务仍在；本轮新报告字段完整，不迁移历史文件。
- 本轮角色运行实例完成审查后，`ROSTER.md` 被另一个并发任务改为 `issue-pending-confirmations-bypass-inline-gate`；本轮不覆盖该任务的 roster 所有权回写。
- 工作区已有无关未跟踪 `dist/* 2.*` 重复文件，禁止纳入本次提交。

## Git 状态

- Branch: `main`。
- Baseline HEAD: `2ca62ee4db0cceefd0592a3edd841c7b581e4fb8`。
- Approved scope: 节点正文、回归测试、0.4.18 版本字段与 MCP 生成产物、本轮三份报告与三条 QUEUE resolved 记录；明确排除并发任务拥有的 `ROSTER.md`。
- Planned commit: `fix: 修正 AGENTS 节点的 Agent Team 提示`。
