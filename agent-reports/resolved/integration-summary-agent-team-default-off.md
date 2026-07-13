---
schema_version: 1
report_id: integration-summary-agent-team-default-off
report_type: integration-summary
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: null
created_at: 2026-07-13T08:08:40Z
updated_at: 2026-07-13T08:08:40Z
depends_on:
  - issue-agent-team-default-off
  - solution-agent-team-default-off
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/tests/markdown-flow-smoke.mjs
  - design.md
verification_status: passed
verification_evidence:
  - Automated code, build, bundle, and plugin gates pass.
  - Browser-visible default and persistence checks pass.
---

# Agent Team 默认关闭集成总结

## 本轮目标

把 Agent Team 从默认开启改为用户显式选择开启，避免普通 Run 产生不必要的多 Agent Token 开销。

## Agent 状态与角色决策

- Product Agent：确认高成本 Agent Team 应为 opt-in，并要求异常非布尔旧值安全关闭。
- Development Agent：审查最小实现与兼容边界，确认设置、Markdown 和设计基线范围。
- Test Supervisor Agent：审查回归矩阵；自动测试与主线程浏览器验收通过。
- Design Agent：并发席位限制下由 Main Thread 检查；开关布局与交互未变化。
- Design Standards Expert：并发席位限制下由 Main Thread 更新 `design.md` 默认值。
- Customer Support Agent：并发席位限制下由 Main Thread 审查 README；中英文已描述为可选，无需更新。
- Development Standards Lead：并发席位限制下由 Main Thread 检查；无 durable workflow 或命令变化，`AGENTS.md` 无需更新。
- Skill Expert Agent：并发席位限制下由 Main Thread 检查；无 skill 触发或协议文件变化。
- Project Management Agent：在验证冻结后负责选择性暂存和提交。

## 已完成改动

- 新用户、缺字段旧设置和异常非布尔值默认关闭 Agent Team。
- 已显式保存的布尔开启/关闭选择保持。
- 默认 Markdown 不注入 Agent Team 协议，显式开启仍可用。
- 恢复默认回到关闭。
- 设计基线和回归测试同步。

## 验证

- `test:markdown`：通过。
- `typecheck`：通过。
- `build`：通过，仅保留既有 Vite 大 chunk 警告。
- `check:mcp-bundle`：通过。
- plugin validation：通过。
- 浏览器：默认 `aria-checked=false`；显式开启保存并刷新后为 `true`；恢复默认后为 `false`。
- `git diff --check`：通过。

## 未解决 / 风险

- 设置 UI/localStorage 持久化没有独立自动化 UI 测试，当前依赖浏览器验收。
- Agent Team validator 因仓库既有 legacy 根报告、旧模板和 QUEUE schema 债务失败；本轮未扩大范围修复历史报告，最新集成总结也已记录同一既有问题。
- 本轮不是 MCP runtime 行为变化，不触发插件版本同步要求；Codex 已安装缓存若要读取新 web bundle，仍需通过后续版本安装/宿主刷新交付。

## Git 状态

- Branch: `main`。
- Baseline HEAD: `e7e38f7c0f217c795e907f9ebea3d5eaf910d25f`。
- Approved scope: 默认值、严格 opt-in 归一化、Markdown 测试、`design.md`、构建产物、ROSTER/QUEUE/issue/solution/integration reports。
- Planned commit: `fix: 默认关闭 Agent Team`。
