---
status: resolved
report_type: solution
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 13:40
updated_at: 2026-07-07 13:40
related_issue: agent-reports/resolved/20260707-1340-development-issue-widget-daemon-fetch-failed.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
  - AGENTS.md
  - design.md
  - plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
---

# Widget CSP 注入 daemon 精确 origin

## 负责 Agent

Development Agent；主线程集成实现。Product Agent、Test Supervisor Agent 参与复核。

## 对应问题

`agent-reports/resolved/20260707-1340-development-issue-widget-daemon-fetch-failed.md`

## Root Cause

`0.1.33` 已经把 Canvasight app 直接放进 native widget 里运行，但 widget app 需要 fetch 本地 daemon API。daemon 本身健康，CORS 和 PNA preflight 也正常；`Failed to fetch` 的更高概率原因是 Codex widget host 没有从 wildcard `http://127.0.0.1:*` 推导出当前 daemon 端口权限，导致 fetch 在宿主 CSP/connect-src 层被拦截。

## 调研过程

1. 用户截图显示原生组件不再被屏蔽，说明直接 app 已启动。
2. 当前插件为 `canvasight@canvasight-local 0.1.33`，daemon 为 `http://127.0.0.1:53208`。
3. 本机请求 `GET /api/health` 返回 200。
4. 模拟 `Origin: null` 的 OPTIONS preflight 返回 204，并包含 CORS 与 `access-control-allow-private-network: true`。
5. 检查 widget metadata，发现只包含 `http://127.0.0.1:*` / `http://localhost:*`，没有 `http://127.0.0.1:53208` 这类 exact origin。
6. Development Agent 和 Test Supervisor Agent 均确认 exact origin 应进入 resource metadata 和 tool result metadata。

## 可选方案

- 方案 A：继续只依赖 wildcard localhost CSP。已被当前 `Failed to fetch` 现象否定，风险高。
- 方案 B：动态把当前 daemon exact origin 写入 widget CSP，同时保留 wildcard fallback。改动小且与当前 daemon 模型一致。
- 方案 C：放弃 widget document fetch，改成所有数据都走 host tool bridge。改动面大，可作为后续 host 仍阻断 loopback fetch 时的备选。

## 推荐方案

采用方案 B。`canvasightWidgetResourceMeta()` 从当前 `httpState.origin`、`~/.canvasight/daemon.json`、tool result `widgetData.origin` 收集精确 loopback origin，写入 `ui.csp.connectDomains` 和 `openai/widgetCSP.connect_domains`。`widgetToolMeta()` 也携带同样 CSP，避免宿主只读取 tool result metadata 时丢失 exact origin。

## 实施步骤

1. 新增同步读取 daemon state 的 helper。
2. 新增 `canvasightWidgetConnectDomains()`，只接受 `http://127.0.0.1:<port>` / `http://localhost:<port>` 和固定 fallback。
3. 更新 `canvasightWidgetResourceMeta()`，为 connect/frame/resource domains 注入 exact origin。
4. 更新 `widgetToolMeta()`，把同样 CSP 放进 tool result `_meta`。
5. 更新 widgetData，直接包含 `apiBaseUrl`、`canvasightHost`、`token`。
6. 更新 MCP smoke：断言 exact origin 在 tool `_meta`、resource `_meta` 中出现，并验证 PNA preflight。
7. 同步 README、troubleshooting、design.md、AGENTS.md，并 bump 到 `0.1.34`。

## 风险与回滚

- 如果 Codex host 对同一 `ui://` resource 缓存旧 CSP，用户仍需 reload/new thread。
- 如果 host 不允许 widget document 访问 loopback，即使 exact CSP 也可能失败；届时需要改走 host tool bridge 拉数据。
- 回滚到 `0.1.33` 会重新出现 direct widget app fetch 风险。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `README.md`
- `AGENTS.md`
- `design.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`

## 验证方式

- `node --check plugins/canvasight/mcp/server.mjs`
- `cd plugins/canvasight && npm run typecheck`
- `cd plugins/canvasight && npm run build`
- `cd plugins/canvasight && npm run test:mcp`
- `cd plugins/canvasight && npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`

## 后续风险

- 需要 reinstall 后 reload/new thread，用真实 native widget 验证 `Failed to fetch` 是否消失。
- 若仍失败，下一轮重点检查真实 host console 的 CSP/PNA 报错或改用 host tool bridge 数据通道。
