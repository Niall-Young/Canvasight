---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 21:28
updated_at: 2026-07-06 21:41
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
solution_report: agent-reports/resolved/20260706-2141-development-solution-run-false-sent-drops-payload.md
---

# Run 显示 sent 但当前 thread 无消息且 payload 被丢弃

## TL;DR

浏览器/dev 页面把 isolated app-server `turn/start` accepted 误判为当前 Codex thread 可见发送成功，导致 UI 误报且 payload 不进入 `await_canvasight_run` 队列。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

用户在 `http://127.0.0.1:5173/` 点击有内容节点的 Run 后，Canvasight toast 显示“已发送到已绑定 Codex thread”，但左侧当前 Codex thread 没有新增用户消息或后续 turn。

## 现象

- 页面显示发送成功。
- 当前 Codex UI 没有出现 Run Markdown。
- `enqueueRun()` 在 `delivery.status === "sent"` 时不入队，用户也无法通过 `await_canvasight_run` 稳定找回这次 payload。

## 复现方式

1. 在 Codex 内置浏览器打开 `http://127.0.0.1:5173/`。
2. claim 当前项目/thread 或使用已 claim 的 dev session。
3. 点击有正文的节点 Run。
4. 观察 toast 与当前 Codex thread 消息列表。

## 影响范围

- Browser/dev fallback Run delivery。
- `claim_canvasight_thread` 后的旧浏览器页接收路径。
- 用户对“已发送到当前/绑定 thread”的信任。

## 证据

- 用户截图显示 toast 为“已发送到已绑定 Codex thread”，但 Codex 输入区/消息历史无新增 Run 内容。
- `plugins/canvasight/mcp/server.mjs` 中 `dispatchRunToCodexThread()` 成功调用 `startCodexTurn()` 后返回 `status: "sent"`。
- `enqueueRun()` 对 `status: "sent"` 不执行 `session.runQueue.push(normalized)`。

## 初步归因

`codex app-server --stdio` 的 `turn/start` accepted 不是当前 Codex Desktop 可见 thread 的发送证明；Canvasight 把传输层 accepted 误当成产品层 sent。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 什么条件下 Canvasight 才能显示 `sent`？
- Browser/dev fallback 是否应该继续尝试 native `turn/start`？
- `turn/start` accepted 后 payload 是否必须保留在 await 队列？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`

## 期望结果

只有 native widget host bridge 成功发送 follow-up message 时才显示“已发送到当前 Codex thread”。Browser/dev fallback 无法证明可见发送时必须进入 `await_canvasight_run` 队列，并显示 queued/unverified 状态。

## Closure Criteria

- [ ] 问题原因明确
- [ ] 方案报告已回写
- [ ] 修改文件已记录
- [ ] 验证方式已记录
- [ ] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。Browser/dev fallback 不再把 native app-server `turn/start` accepted 当作 `sent`，默认进入 `await_canvasight_run` 队列；即使显式打开 native direct，accepted 后也保留队列 payload。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `README.md`
- `AGENTS.md`
- `design.md`
- `plugins/canvasight/skills/**`

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run test:mcp`
- `npm run build`
- plugin validation
- in-app browser visible Run toast + daemon queue retrieval

## 后续风险

浏览器 fallback 仍不能像 native widget 一样自动确认当前 GUI thread 可见发送；自动可见发送必须走 `render_canvasight_canvas_widget` host bridge。
