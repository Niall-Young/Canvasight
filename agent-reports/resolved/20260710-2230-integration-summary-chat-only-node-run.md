---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: high
created_at: 2026-07-10 22:30
updated_at: 2026-07-10 22:30
related_files:
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Chat-only 节点 Run 集成总结

## 本轮目标

- 按用户指令移除节点 Plan 与 Goal，只保留 Chat Run。

## Agent 状态

- Development：移除 UI、类型、Markdown、payload 和 native Plan/Goal 路径；旧字段自动剥离。
- Test Supervisor：覆盖旧节点、持久化数据和 widget payload 的 Chat-only 兼容。
- Customer Support：更新双语 README。
- Skill Expert：收敛 Canvasight Run skill 为 Chat-only。
- 其他固定角色：本轮无额外规范、设计或 git 策略变更；main-thread 完成集成、版本与安装检查。

## Agent 输入

- `resolved/20260710-2215-development-solution-chat-only-node-run.md`
- `resolved/20260710-2214-test-solution-chat-only-run-contract.md`
- `resolved/20260710-2211-customer-support-solution-chat-only-node-run-docs.md`
- `resolved/20260710-2213-skill-expert-solution-chat-only-run-contract.md`

## 已解决

- 节点不再展示或保存 Plan/Goal 选择。
- 历史 `.scatter`、旧 API 与旧 widget payload 的 `codexMode` / `planMode` 被剥离；节点标题、正文和附件保留，按 Chat 投递。
- Markdown、daemon、widget bridge、README 与 skills 均为 Chat-only。
- 已安装 `canvasight@canvasight-local` `0.3.7+codex.20260710222500`。

## 未解决

- 无；原生 Plan/Goal 已按用户指令移除。

## 风险

- 将来若重做原生 Plan/Goal，必须从 Desktop host 的公开模式控制 API 重新设计，不能恢复旧 app-server 推断。

## 修改文件

- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/markdown.ts`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/markdown-flow-smoke.mjs`
- `plugins/canvasight/skills/canvasight-run/`
- `README.md`

## 验证方式

- `npm run typecheck`
- `npm run test:markdown`
- `npm run test:mcp`
- `npm run build`
- plugin 与 Run skill validation
- `git diff --check`
- plugin reinstall + `codex plugin list`

## 验证记录

- 全部自动化和校验通过；Vite 仅报告既有大 chunk 建议。

## 回写状态

- `agent-reports/QUEUE.md` 已更新；本轮角色报告均在 `resolved/`。

## Git 状态

- branch: main
- commit: 未创建
- worktree: 包含本轮未提交改动
