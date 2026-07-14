---
schema_version: 1
report_id: integration-summary-skill-led-project-guidance-omission
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: null
created_at: 2026-07-14T07:01:00Z
updated_at: 2026-07-14T07:01:00Z
depends_on:
  - issue-skill-led-project-guidance-omission
  - solution-skill-led-project-guidance-omission
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - Product, Development, and Test role reviews approved the scoped behavior.
  - Build, MCP smoke, release verification, bundle freshness, and plugin validation passed.
---

# Skill-led 项目指导节点恢复集成总结

## 本轮目标

恢复项目缺少 `AGENTS.md` 时的创建节点，同时保持 Agent Team 为未启用的可选流程。

## Agent 状态与角色决策

- Product Agent：确认 skill-led 仅主导专业内容，software-product 项目治理仍必须执行。
- Development Agent：确认生成与校验双重旁路，并要求只豁免服务端实际生成的 guidance node id。
- Test Supervisor Agent：确认正向 AGENTS 隔离用例及 refine / 非产品负向边界。
- Design Agent：Main Thread 检查；无 UI、布局、视觉或交互变化。
- Design Standards Expert：Main Thread 检查；`design.md` 的 Agent Team opt-in 基线未变化。
- Customer Support Agent：Main Thread 检查；用户流程、命令和故障排查步骤未变化，README 无需更新。
- Development Standards Lead：Main Thread 检查；无 durable workflow 变化，AGENTS.md 无需更新。
- Skill Expert Agent：Main Thread 检查；未修改 Skill 文件或触发边界。
- Project Management Agent：验证冻结后负责 scoped diff 审查；若席位受并发任务占用，由 Main Thread 完成同等闭环。

## 已完成改动

- skill-led software-product 非 refine 恢复缺失项目指导节点。
- 自动 guidance 节点按服务端实际生成 id 豁免专业 coverage。
- 最终项目指导校验不再允许 skill-led 旁路。
- 增加 skill-led 缺 AGENTS 正向回归和 skill-led article create 负向回归。
- 同步 0.4.19 与自包含 MCP bundle。

## 验证

- `npm run build`：通过，仅有既有 Vite 大 chunk 警告。
- `npm run test:mcp`：通过。
- `npm run check:mcp-bundle`：通过。
- `npm run release:verify -- 0.4.19`：通过。
- plugin validation：通过。
- `git diff --check`：通过。
- 浏览器 / native widget：不适用；未修改 UI 或 Widget host 行为。

## 未解决 / 风险

- 全仓 Agent Team validator 的既有 legacy 报告、旧模板和 QUEUE schema 债务仍不属于本轮范围。
- `ROSTER.md` 与 QUEUE 的 assigned 行正由并发 `issue-update-creates-numbered-duplicates` 任务持有；本轮不覆盖其 seat/issue 回写，只选择性暂存本轮 resolved 记录。

## Git 状态

- Branch: `main`。
- Baseline HEAD: `de7830644efe03bd9a25348719bd9f080dff0f9e`。
- Approved scope: 生成/校验逻辑、MCP smoke、0.4.19 版本字段与 MCP bundle、本轮三份 resolved 报告及三条 QUEUE resolved 记录。
- Planned commit: `fix: 恢复 skill-led 的 AGENTS 指导节点`。
