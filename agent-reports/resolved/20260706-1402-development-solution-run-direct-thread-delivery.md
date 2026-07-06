---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-06 14:02
updated_at: 2026-07-06 14:02
related_issue: agent-reports/resolved/20260706-1349-development-issue-run-not-sent-to-thread.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Run 直接发送当前 Codex Thread 解决方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1349-development-issue-run-not-sent-to-thread.md`

## Root Cause

Canvasight Run 仍是 pull-only 设计。网页点击 Run 只调用 `/api/sessions/:sessionId/run` 并把 payload 放入 waiter 或 session 队列；只有 Codex thread 主动调用 `await_canvasight_run` 时才会收到 Markdown。前端成功态又自动打开 Markdown drawer，导致用户看到“预览打开了”，但当前 Codex thread 没有真正收到任务。

## 调研过程

- Product Agent 明确 Run 是提交动作，不是 Markdown preview。
- Development Agent 确认链路是 `runActiveNode -> runNode -> canvasightApi.run -> enqueueRun`，缺少主动发送到 Codex thread 的步骤。
- Test Supervisor Agent 要求覆盖 waiter、无 waiter、Chat / Plan / Goal 和 fallback。
- 主线程读取 Codex app-server 协议，确认 `turn/start` 可用且不需要虚拟点击、剪贴板或 Accessibility。

## 可选方案

- 方案 A：继续要求用户手动调用 `await_canvasight_run`。不能解决用户点击 Run 后当前 thread 不接收的问题。
- 方案 B：恢复虚拟点击或剪贴板输入。违反项目边界，且不稳定。
- 方案 C：在服务端 Run 路径中使用 Codex app-server 原生 `turn/start`，保留 `await_canvasight_run` 作为 fallback。

## 推荐方案

采用方案 C。它符合“不用虚拟点击”的约束，并能让打开画布的当前 Codex thread 直接收到 Run；已有 waiter 时继续走原有 `await_canvasight_run`，避免重复提交。

## 实施步骤

1. `enqueueRun` 检测是否已有 waiter；有 waiter 时直接完成等待。
2. 无 waiter 时先应用 Chat / Plan / Goal 原生模式，再调用 `turn/start` 提交 Markdown 和本地图片输入。
3. `turn/start` 成功时不再把 payload 留在 runQueue；失败、无 thread 或 native disabled 时进入队列 fallback。
4. 前端 API 返回 `sent` / `queued` / `awaited` 细分状态，Run 成功不再把 Markdown drawer 当作唯一反馈。
5. MCP smoke 增加 direct-send、waiter 防重复和 fallback 断言。
6. 同步 README、AGENTS、design、Run/Open/Troubleshooting Skills 和插件版本 `0.1.17`。

## 风险与回滚

风险是 Codex app-server `turn/start` 协议未来变化。回滚方式是恢复 `enqueueRun` 只入队的旧逻辑，并将版本回退到上一个 runtime 版本。

## 处理结果

已修复。

## 修改文件

- `AGENTS.md`
- `README.md`
- `design.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `npm run test:dev-server`
- Skill quick validation for changed skills
- Plugin validation
- Browser smoke against `http://127.0.0.1:5173/`

## 后续风险

旧 Codex thread 可能仍运行 0.1.16 MCP cache；需要重装插件并新开或 reload thread 使用 0.1.17。
