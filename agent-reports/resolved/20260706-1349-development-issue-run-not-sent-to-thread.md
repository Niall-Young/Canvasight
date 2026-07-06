---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 13:49
updated_at: 2026-07-06 14:02
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260706-1402-development-solution-run-direct-thread-delivery.md
---

# Run 点击后未发送到当前 Codex Thread

## TL;DR

Canvasight 网页 Run 只把 Markdown 打开为预览，没有在没有 `await_canvasight_run` waiter 时主动把 payload 发送到打开该画布的 Codex thread。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

用户点击 Canvasight 的运行按钮后，界面进入 Markdown 预览，但当前 Codex thread 没有收到任务消息。Run 的产品语义应是提交到 Codex，而不是只打开预览。

## 现象

- 前端点击 Run 后显示 Markdown drawer。
- `/api/sessions/:sessionId/run` 只返回 `queued`。
- 没有正在等待的 `await_canvasight_run` 时，payload 留在 daemon 队列里，不会自动进入当前 Codex thread。

## 复现方式

1. 用 `open_canvasight` 或当前开发页打开 Canvasight。
2. 创建一个有内容的节点。
3. 不在 Codex thread 中调用 `await_canvasight_run`，直接点击节点或工具栏 Run。
4. 观察右侧 Markdown 打开，但当前 Codex thread 没有新增消息或任务执行。

## 影响范围

- Canvasight Run 主链路。
- Chat / Plan / Goal 的原生 Codex 模式触发。
- 用户对“网页画布输出给当前 Codex thread”的核心预期。

## 证据

- `plugins/canvasight/src/App.tsx` 的 `runNode` 成功后调用 `setDrawer("markdown")`。
- `plugins/canvasight/mcp/server.mjs` 的 `/run` 处理只调用 `enqueueRun`。
- `applyCodexNativeMode` 只在 `toolAwaitCanvasightRun` 中执行。

## 初步归因

Run delivery 仍是旧的 pull-only 设计：只有 Codex 主线程主动调用 `await_canvasight_run` 才能收到 payload。网页 Run 没有通过 Codex app-server 发起 `turn/start`。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何在无 waiter 时用非虚拟点击方式把 Markdown 提交到当前 Codex thread？
- 如何保留 `await_canvasight_run` 作为等待者和 fallback，不产生重复提交？
- 前端如何区分已发送、已交给 waiter、已排队等待接收、发送失败？

## 相关文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

点击 Run 后，如果 session 绑定了 Codex thread，Canvasight 应通过 Codex app-server 向该 thread 发起 `turn/start`；Plan / Goal 同步应用原生模式。若无法直接发送，则明确进入等待接收状态，并继续支持 `await_canvasight_run`。

## Closure Criteria

- [ ] 问题原因明确
- [ ] 方案报告已回写
- [ ] 修改文件已记录
- [ ] 验证方式已记录
- [ ] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。Run 在没有等待中的 `await_canvasight_run` waiter 时会通过 Codex app-server `turn/start` 发送到 session 绑定的 Codex thread；已有 waiter 时仍走原等待路径，避免重复提交。无法直接发送时保留队列 fallback。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`
- `AGENTS.md`
- `design.md`
- `plugins/canvasight/skills/canvasight*/`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `npm run test:dev-server`
- Skill quick validation
- Plugin validation
- Browser smoke

## 后续风险

真实 Codex app-server `turn/start` 协议如果后续变更，需要同步 smoke fake server 和 runtime wrapper；旧已打开线程仍可能需要重装或 reload 插件后才能使用 0.1.17。
