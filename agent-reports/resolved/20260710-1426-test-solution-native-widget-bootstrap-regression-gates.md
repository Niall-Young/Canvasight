---
status: resolved
report_type: solution
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: critical
created_at: 2026-07-10 14:26
updated_at: 2026-07-10 14:26
related_issue: agent-reports/assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# 原生 Widget bootstrap 回归门禁

## 负责 Agent

Test Supervisor Agent

## 对应问题

`agent-reports/assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md`

## Root Cause

旧 smoke 用 `FakeApp.connect()` 模拟 MCP Apps 宿主，并在 module 插入后人工触发 `load` 事件作为就绪证据，无法捕捉真实 `postMessage` 初始化、tool-result 交付、OpenAI globals 事件、动态 session 数据与 React/API ready 合同回归。

## 调研过程

- 核对本地 `@modelcontextprotocol/ext-apps` SDK：View 需在 `connect()` 前注册 `toolresult` listener，并通过 `PostMessageTransport` 接收 `ui/notifications/tool-result`。
- 确认旧 `FakeApp` 和人工 script `load` 是此前假阳性来源。
- 核对新 `widgetBridge.ts` / `canvasightApi.ts` 合同，将门禁对齐为标准 postMessage、`event.detail.globals`、metadata timeout、动态 runtime 和 ready ACK。

## 可选方案

- 方案 A：保留 FakeApp 并增加 metadata shape。拒绝，它会继续复制实现假设。
- 方案 B：在 Vite SSR 环境中加载真实 bridge 模块和 ext-apps SDK，使用 JSON-RPC postMessage 宿主仿真，保留真实 Codex 宿主作为最终验收。

## 推荐方案

采用方案 B，自动回归使用真实 `App` / `PostMessageTransport`，同时不把 VM 宿主误报为 Codex 实机验收。

## 实施步骤

1. 删除 `FakeApp` / 旧 inline bridge harness。
2. 增加真实 ext-apps postMessage 宿主仿真，覆盖 `ui/initialize` / `ui/notifications/initialized` / `ui/notifications/tool-result`。
3. 验证 `openai:set_globals` 从 `event.detail.globals` 消费 widget data。
4. 验证 metadata 缺失超时可见，普通 `load` 不能清除 loading，只有 `canvasight:app-ready` 可完成状态转换。
5. 用 Vite SSR 加载真实 `canvasightApi.ts`，验证 widget data 后到达时请求动态使用真实 `sessionId` / `token`。
6. 增加 `await_canvasight_widget_ready` 的 timeout、ready ACK、`reactMounted=true` 和错误 task 绑定覆盖。

## 风险与回滚

新 harness 使用真实 ext-apps SDK，但仍是 Node/Vite 内构造宿主，不能覆盖 Codex Desktop 的实际资源注入顺序、sandbox/CSP 和渲染器行为。不应回滚到 FakeApp 就绪判定。

## 处理结果

自动 bootstrap 回归门禁已完成；主 issue 仍保持 `assigned`，等待真实 Codex 新 task 原生 widget 验收。

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`
- `agent-reports/assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md`
- `agent-reports/resolved/20260710-1426-test-solution-native-widget-bootstrap-regression-gates.md`

## 验证方式

- `npm run test:mcp` 通过；最终回归已删除 FakeApp 旧 harness。
- `npm run test:markdown` 通过。
- `npm run test:dev-server` 通过。
- `npm run typecheck` 通过。
- `npm run build` 通过，仅有 Vite chunk 体积警告。
- MCP smoke 的旧有并发 daemon 启动用例曾出现一次瞬时超时，随后复跑通过。

## 后续风险

- 必须在安装准确版本后使用真实 Codex 新 task 验证：完整画布可见、至少一个有意义控件可点击、Run 到达同一 task。未完成前不得宣布已修复。
- 并发 daemon 启动 smoke 存在一次未稳定超时记录；当前不可重现，但需继续监控。
- Vite 产物为单个约 1.6 MB module；真实 Codex 宿主的加载和内存行为仍需实机验证。
