---
schema_version: 1
report_id: integration-summary-agent-team-only-agents-guidance
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: null
created_at: 2026-07-14T07:31:10Z
updated_at: 2026-07-14T07:31:10Z
depends_on:
  - issue-agent-team-only-agents-guidance
  - solution-agent-team-only-agents-guidance
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - Product, Development, and Test reviews agree on the three-state AGENTS.md contract.
  - Build and MCP smoke passed; final release and plugin gates are recorded before commit.
---

# Agent Team-only AGENTS.md 指导节点集成总结

## 本轮目标

开启 Agent Team 后仍保留补齐项目通用 `AGENTS.md` 规则的可见节点，同时不重复创建受管协议。

## Agent 状态与角色决策

- Product Agent：定义 missing / managed-only / substantive 三态及不同节点语义。
- Development Agent：确认 Run 预处理与文件存在去重的交互，并采用共享状态函数。
- Test Supervisor Agent：审查三态 smoke、专用正文与显式标题去重边界。
- Design Agent：Main Thread 检查；无 UI 布局或视觉变化。
- Design Standards Expert：Main Thread 检查；Agent Team opt-in 与画布模型未变化，`design.md` 无需更新。
- Customer Support Agent：Main Thread 检查；无新命令或用户流程，README 无需更新。
- Development Standards Lead：Main Thread 检查；无 durable workflow 变化，AGENTS.md 无需更新。
- Skill Expert Agent：Main Thread 按 `canvasight-agent-team` Skill 核对受管块边界；Skill 文件无需修改。
- Project Management Agent：验证冻结后执行 scoped staging 与提交。

## 已完成改动

- AGENTS guidance 从文件存在检查升级为内容三态检查。
- managed-only 状态使用“完善 AGENTS.md”节点和保留受管段的专用正文。
- 手写“完善 AGENTS.md”标题纳入指导意图去重。
- 增加 managed-only 与 managed+substantive MCP smoke。
- 同步 0.4.20 与自包含 MCP bundle。

## 验证

- `npm run build`：通过，仅有既有 Vite 大 chunk 警告。
- `npm run test:mcp`：通过。
- `npm run check:mcp-bundle`：通过。
- `npm run release:verify -- 0.4.20`：通过。
- plugin validation：通过。
- `git diff --check`：通过。
- 浏览器 / native widget：不适用；未修改 UI 或 Widget host 行为。

## 报告与队列状态

- issue 与 solution 已直接落在 resolved；没有 active issue，因此 `agent-reports/QUEUE.md` 按当前 Agent Team schema 不新增 resolved 行。
- ROSTER 回写 Product、Development、Test 三个本轮角色；Test 保留既有 native-host blocker 状态。

## 未解决 / 风险

- 全仓 Agent Team validator 失败，原因仍是协议生效前 legacy 报告、旧模板和既有 QUEUE schema 债务；本轮新报告字段完整，不迁移历史文件。

## Git 状态

- Branch: `main`。
- Baseline HEAD: `eac833f4843073d13f6bafb76c5e43680d8ecd4e`。
- Approved scope: 三态检测、专用节点文案、MCP smoke、0.4.20 版本字段与 bundle、三份 resolved 报告及三席 ROSTER 回写。
- Planned commit: `fix: 保留 Agent Team 下的 AGENTS 完善节点`。
