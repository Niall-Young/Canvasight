---
status: resolved
report_type: issue
owner: development-agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 19:35
updated_at: 2026-07-06 20:03
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-run/SKILL.md
solution_report: agent-reports/resolved/20260706-2003-development-solution-run-widget-bridge.md
---

# Canvasight Run 无法从网页按钮直达当前 Codex thread

## TL;DR

当前 Canvasight 使用 localhost/in-app browser 网页，网页没有 Cowart native widget 的 Codex host bridge，因此按钮 Run 只能进入队列或伪 native direct，不能可靠发送到当前可见 Codex thread。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

development-agent

## 问题描述

用户在当前 Codex thread 的侧边栏浏览器里打开 Canvasight 后，点击有内容节点的 Run 按钮，左侧 Codex 输入框/对话没有收到任何消息。实际检查发现 Run payload 已经进入 Canvasight daemon queue，可由 `await_canvasight_run` 取出，但网页侧没有能够调用当前 Codex host 的消息桥。

## 现象

- 点击节点 Run 后，页面没有足够明显的成功反馈。
- 左侧当前 Codex thread 没有出现 Canvasight Run 消息。
- `await_canvasight_run({ sessionId })` 能拿到同一 payload，证明按钮触发和 payload 生成正常。
- `claim_canvasight_thread({ sessionId })` 在 MCP 环境没有当前 thread id 时返回 `missing_thread_id`。

## 复现方式

1. 在 Codex 当前 thread 调用 `open_canvasight` 打开 Canvasight。
2. 在侧边栏浏览器中编辑一个节点内容。
3. 点击节点 Run 按钮。
4. 观察当前 Codex thread 没有收到消息。
5. 调用 `await_canvasight_run({ sessionId })` 可以收到刚才的 payload。

## 影响范围

- Canvasight Run 入口。
- Chat / Plan / Goal 节点执行模式。
- 用户对“当前 thread 接收 Canvasight 输出”的核心预期。
- 与 Cowart 原生 widget 的体验对齐。

## 证据

- `await_canvasight_run` 返回用户点击的 `Canvasight 任务: 新建任务 4` payload。
- payload 中 `codexNative.status` 为 `disabled`，reason 为 `native_direct_requires_explicit_opt_in`。
- `delivery.status` 为 `queued`，`delivery.threadId` 为 `null`。
- Cowart 使用 MCP native widget 和 `app.sendMessage()` host bridge，而不是 localhost browser。

## 初步归因

Canvasight 当前开的是本地网页。Codex in-app browser 不会自动把当前 thread id 或 `app.sendMessage()` bridge 注入网页，因此网页无法直接把消息推到当前 thread。Cowart 能做到是因为它通过 `openai/outputTemplate` 渲染原生 MCP widget，widget host 提供 `@modelcontextprotocol/ext-apps` bridge。

## 交付给哪个 Agent

development-agent

## 需要回答的问题

- Canvasight 是否应新增原生 widget 打开路径作为默认入口？
- 是否能复用现有 Vite 网页和 daemon，并用 widget iframe 外壳桥接 `app.sendMessage()`？
- Run direct send 成功/失败/queued fallback 应如何在 UI 和测试中区分？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`

## 期望结果

默认打开 Canvasight 时优先使用 Codex native widget。用户在 widget 中点击 Run 后，Canvasight 通过 host bridge 发送 follow-up message 到当前 Codex thread；如果 bridge 不可用，再明确进入现有 queued fallback，并展示可见状态。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复：默认打开路径新增 Codex native widget，Run 在 widget 中通过 host bridge 发送 follow-up message 到当前 Codex thread；浏览器 URL 和裸 dev 页面保留 queued fallback。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/skills/canvasight*/**`
- `README.md`
- `AGENTS.md`
- `design.md`

## 验证方式

- `node --check plugins/canvasight/mcp/server.mjs`
- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local && codex plugin list`

## 后续风险

真实 Codex widget 点击 Run 的端到端验证需要新开 Codex thread 或 reload 后使用 `render_canvasight_canvas_widget`，当前已打开线程不会热刷新新 MCP tool/resource。
