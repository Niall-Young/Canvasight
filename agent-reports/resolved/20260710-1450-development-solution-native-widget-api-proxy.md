---
status: resolved
report_type: solution
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-10 14:50
updated_at: 2026-07-10 14:50
related_issue: agent-reports/assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# 原生 Widget API 代理修复

## 负责 Agent

Development Agent 分析，main-thread 集成实现。

## 对应问题

`agent-reports/assigned/20260710-1359-development-issue-native-widget-bootstrap-architecture-reset.md`

## Root Cause

真实 0.2.0 widget 显示 `Connecting Canvasight session...`，证明 React bundle、bridge 和 session metadata 已经执行。随后 `App.getSession()` 直接从 sandboxed native widget fetch `http://127.0.0.1:<daemon>`，请求没有完成，ready ACK 永远不会发送。

同时 MCP host 可在 open tool 尚未完成、daemon 精确端口尚未写入时读取 widget resource；旧 resource CSP 只能包含通配端口，不能作为真实宿主放行精确 daemon origin 的保证。旧 smoke 手工 dispatch `canvasight:app-ready`，没有运行真实 session GET 和 ready POST，产生假绿。

## 调研过程

- 读取用户附带的真实 tool transcript，确认 session、thread、timeout 和 `reactMounted:false` 默认 telemetry。
- 对照截图与 `widgetBridge.handleToolResult`，确认 Connecting 发生在 metadata 解析成功之后。
- 对照 lifecycle 时间线，确认 0.2.0 MCP/daemon 正常启动，资源读取与 daemon state 写入存在竞态。
- 检查 frontend API，确认所有 session/document/template/attachment/run/reveal 请求均为 JSON，可统一通过 MCP Apps `callServerTool` 代理。

## 推荐方案

Native widget JSON API 不再直接 fetch localhost。新增 app-only `canvasight_widget_api`，严格允许 `/api/sessions`、`/api/templates` 和 `/api/reveal` 以及 GET/POST/DELETE，由 MCP shim 带 daemon token 转发。浏览器/dev fallback 保持直接 fetch。资源读取先等待 daemon，确保 attachment asset CSP 带精确 origin。

## 实施步骤

1. `canvasightApi.requestJson` 在 native shell 优先调用 `canvasightMcp.callServerTool`。
2. 新增 app-only `canvasight_widget_api` descriptor 和严格路径/方法 allowlist。
3. MCP proxy 返回稳定的 `{ok,status,data,error,code}` envelope，frontend 恢复为 `CanvasightApiError`。
4. `resources/read` 等待 daemon ready 后生成 exact-origin CSP。
5. OpenAI compatibility 同时接受 `event.detail.globals` 和直接 `event.detail`。
6. 回归测试禁止 native localhost fetch，覆盖 proxy session GET、ready POST、await ready 和 exact CSP origin。

## 处理结果

实现、构建、测试、插件/skill 校验和精确版本重装已完成。新版本为 `0.2.0+codex.20260710064916`。真实 Codex host 尚未复验，主 issue 保持 assigned。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/dist/`
- 四处版本合同文件
- `AGENTS.md`、`design.md`、`README.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`

## 验证方式

- `npm run build`：通过。
- `npm run test:mcp`：通过；native runtime 断言零 localhost fetch，proxy session/ready 和 exact CSP origin 均通过。
- `npm run test:markdown`：通过。
- `npm run test:dev-server`：通过。
- plugin validator、troubleshooting skill validator、`git diff --check`：通过。
- `codex plugin list`：installed/enabled `0.2.0+codex.20260710064916`。

## 后续风险

- 必须重载/restart Codex 后用新版本完成真实 ready、可见、控件和 Run 验收。
- daemon-backed attachment asset URL 仍依赖 resource CSP exact origin；resource read 已改为等待 daemon，但需在真实附件场景验证。
