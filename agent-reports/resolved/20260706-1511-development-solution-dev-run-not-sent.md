---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-06 15:11
updated_at: 2026-07-06 15:11
related_issue: agent-reports/resolved/20260706-1457-development-issue-dev-run-not-sent.md
related_files:
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/tests/dev-server-smoke.mjs
  - plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md
  - plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
  - README.md
  - AGENTS.md
---

# 修复裸 dev 页面 Run 不发送

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1457-development-issue-dev-run-not-sent.md`

## Root Cause

`http://127.0.0.1:5173/` 裸 dev 页面走 Vite dev middleware。旧 dev API 的 `/api/sessions/:id/run` 仍是早期 mock，只把 payload 放进 Vite 进程内的 `runQueue` 并返回 queued；真正的 daemon `/run` 才会执行 Codex app-server `thread/settings/update` / `thread/goal/set` / `turn/start`。

## 调研过程

- 检查 `plugins/canvasight/vite.config.ts`，确认 `action === "run"` 没有调用 daemon。
- 对照 `plugins/canvasight/mcp/server.mjs`，确认真实 Run 发送逻辑已经在 daemon `enqueueRun()` / `dispatchRunToCodexThread()` 内。
- Product Agent 确认裸 `5173` 不是跨线程正式入口，不能静默成功；无绑定时必须明确失败。
- Development Agent 复核要求 daemon session 复用时校验 `codexThreadId`，避免复用旧 thread。
- Test Supervisor Agent 要求同时覆盖 direct-send 和 `unbound_dev_session` 分支。
- Customer Support / Skill Expert 要求 README、AGENTS 和 troubleshooting skill 同步说明。

## 可选方案

- 方案 A：继续让裸 dev Run 只 queued，再要求用户手动调用 `await_canvasight_run`。这会重复用户看到的失败体验，放弃。
- 方案 B：Vite dev API 直接复制 daemon 的 Run 逻辑。重复运行时代码，后续容易漂移，放弃。
- 方案 C：Vite dev API 代理到项目级 daemon。带 `CODEX_THREAD_ID` 时创建/复用绑定 session 并发送；未绑定时返回 `unbound_dev_session`。采用。

## 推荐方案

采用方案 C。它复用 daemon 的正式 Run 行为，保留 `open_canvasight` 完整 URL 作为正常跨线程入口，同时让裸 dev 页在无法确定当前 thread 时明确失败，不再制造“看起来点了但没发送”的状态。

## 实施步骤

1. 在 `vite.config.ts` 增加 daemon state 读取、健康检查、启动和 JSON 请求 helper。
2. 为 dev session 增加 `daemonSessionId`，按 `projectPath` 和 `codexThreadId` 复用 daemon session。
3. 修改 dev API `/run`：有 `CODEX_THREAD_ID` 时代理 daemon `/run`；无绑定时返回 `409 unbound_dev_session`。
4. 扩展 `test:dev-server`：fake Codex app-server 验证 `turn/start`、payload 正文、cwd，以及无绑定 409 分支。
5. 更新 README、AGENTS 和 troubleshooting skill，明确裸 dev URL 的线程绑定边界。

## 风险与回滚

- 风险：裸 dev server 绑定的是启动进程的 thread，不是任意当前可见 thread。文档已明确正常跨线程应使用 `open_canvasight` 完整 URL。
- 风险：如果 `turn/start` 失败，payload 进入 daemon fallback 队列，裸 `local` session id 不适合作为 await key；应使用 `projectPath` 接收。
- 回滚：恢复 `vite.config.ts` 的 dev `/run` mock 和测试断言即可，但会恢复原始问题，不建议。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`
- `AGENTS.md`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260706-1457-development-issue-dev-run-not-sent.md`
- `agent-reports/resolved/20260706-1511-integration-summary-dev-run-not-sent.md`

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`

## 后续风险

- 裸 dev URL 不是跨线程正式入口；后续如果要让它动态绑定“当前打开的 Codex thread”，需要 Codex app 或 browser bridge 提供当前 thread 上下文，不能靠 HTTP URL 自行推断。
