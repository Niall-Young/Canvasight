---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-10 14:20
updated_at: 2026-07-10 14:20
related_issue: agent-reports/assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/main.tsx
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/vite.config.ts
---

# 原生 Widget bootstrap 架构复位实现方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md`

## Root Cause

原实现把 ext-apps 浏览器包解析、host bridge、metadata 猜测和 Vite bundle 动态注入全部拼接在 `server.mjs` 的字符串脚本中。React 只有拿到隐藏 session URL 后才注入，`openai:set_globals` 又忽略 `event.detail.globals`，因此真实宿主时序稍有不同就会永久停在 `Opening Canvasight...`。同时 `canvasightApi.sessionId/token` 在模块求值时静态固化，直接改为“先挂 React”后仍会错误请求 `local` session。

工具完成也没有 client ready 回执，导致 MCP session 创建成功被错误等同于真实 UI 已打开。

## 调研过程

- 对照 ext-apps `App` 生命周期，确认 listener 应在 `connect()` 前注册，标准 `toolresult` 事件应作为主路径。
- 检查真实 Codex 证据，确认 MCP、resource read、daemon 均成功，故障位于 widget bootstrap。
- 检查 Vite 产物，发现 ext-apps 加入正常 bundle 后默认生成互相引用的多 chunk；原生资源只内嵌入口会再次失效，因此构建必须产出单一自包含 module。
- 检查 React 启动 API，确认所有 session URL 必须在 runtime metadata 到达后动态构造。

## 可选方案

- 方案 A：继续扩展 `server.mjs` 字符串 bridge，增加更多 metadata shape。改动小，但继续保留双实现、时序猜测和不可维护的内联 bootstrap。
- 方案 B：把 ext-apps bridge 移进 TypeScript/Vite 应用，让 React 立即挂载，metadata 只控制 session API，另增 daemon ready ACK。改动集中但消除根因。

## 推荐方案

采用方案 B。widget HTML 只负责声明 native shell、设置版本和静态加载单一 module；`src/lib/widgetBridge.ts` 负责标准 MCP Apps 与 OpenAI 兼容事件；`canvasightApi` 负责 runtime gate；daemon 负责可查询 ready 状态。

## 实施步骤

1. 删除 `server.mjs` 中 ext-apps export 解析、动态 module append 和整段 server-string bridge。
2. 新增 `src/lib/widgetBridge.ts`，通过正常 package import 初始化 `App`，在 connect 前监听 `toolresult`，并从 `openai:set_globals` 的 `event.detail.globals` 消费兼容数据。
3. widget HTML 改为静态 `<script type="module">`，React 无条件首屏挂载；metadata 缺失 10 秒后显示明确错误。
4. `canvasightApi` 改为动态 session/token getter，所有 session request 均先等待 `canvasight:widget-data` 再构造 URL。
5. React `getSession()` 成功后 POST `/api/sessions/:id/widget-ready`；只有 daemon 接受 ACK 才派发 `canvasight:app-ready`。
6. daemon session 增加 widget ready 状态和 waiters；新增 `await_canvasight_widget_ready`，返回 `ready`、`timeout` 或 `failed`。
7. `open_canvasight` 改为 `status=opening`，公开文本要求后续 await，不再声称工具返回即 UI ready。
8. Vite 开启 `inlineDynamicImports`，确保原生资源内嵌 bundle 无外部 chunk 依赖。

## 风险与回滚

主要风险是 bundle 增至约 1.6 MB，以及真实 Codex host 对标准 MCP Apps 初始化仍可能存在宿主侧差异。回滚可恢复上一版 `server.mjs` bridge 与多 chunk 构建，但会重新引入永久 Opening 和假 ready，故不建议作为正常恢复路径。

## 处理结果

开发实现已完成，自动回归门禁已通过。issue 仍保持 `assigned`，必须由主线程在新 Codex task 中验证原生 widget 可见、可点击、Run 回传后才能关闭。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/main.tsx`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/index-Ta_k-kSl.js`

## 验证方式

- `npm run typecheck`：通过。
- `npm run build`：通过，产出单一自包含 JS module。
- `npm run test:mcp`：通过，包含真实 ext-apps postMessage 初始化、标准 tool-result、OpenAI globals、metadata timeout、动态 session/token 与 ready ACK/await。
- `npm run test:markdown`：通过。
- `npm run test:dev-server`：通过。
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`：通过。

## 后续风险

- 尚未完成真实 Codex 新 task 原生 widget 的最终验收，当前不得宣称用户问题已解决。
- 主线程需在版本 bump、重装并新开 task 后依次验证：`open_canvasight` 返回 opening、`await_canvasight_widget_ready` 返回 ready、画布可点击、Run 真正回传当前 task。
- 1.6 MB 单 bundle 是消除原生资源外部 chunk 依赖的当前折中；后续如要优化体积，应使用可由宿主稳定加载的资源清单，而不能恢复运行时字符串注入。
