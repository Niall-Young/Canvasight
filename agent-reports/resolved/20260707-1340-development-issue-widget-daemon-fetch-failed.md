---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 13:40
updated_at: 2026-07-07 13:40
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260707-1340-development-solution-widget-daemon-csp-origin.md
---

# Direct widget app 请求 daemon 失败

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

用户重新打开 Canvasight 后，原生组件已经不再显示“内容被屏蔽”，但 Canvasight UI 内出现 toast：`Failed to fetch`。

本轮检查确认当前插件已经是 `0.1.33`，新的 cache daemon 正在运行，并且 daemon API 在本机可访问。问题更可能发生在 Codex native widget 宿主到本地 daemon 的 fetch 权限/CSP 层。

## 复现方式

1. 安装 `canvasight@canvasight-local 0.1.33`。
2. 在 Codex 中调用 `open_canvasight` 打开 native widget。
3. widget app 渲染后显示 `Failed to fetch` toast。

## 影响范围

- native widget app 可以启动，但无法读取 session/project 数据。
- 用户无法正常操作画布。
- Run bridge 即使存在，也无法在项目数据加载失败时形成完整工作流。

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`

## 证据

- `codex plugin list` 显示 `canvasight@canvasight-local 0.1.33`。
- `~/.canvasight/daemon.json` 显示 daemon origin: `http://127.0.0.1:53208`，serverVersion: `0.1.33`。
- 本机请求 `GET /api/health` 返回 200。
- 本机模拟 `Origin: null` 的 OPTIONS preflight 返回 204，并包含：
  - `access-control-allow-origin: *`
  - `access-control-allow-methods: GET, POST, DELETE, OPTIONS`
  - `access-control-allow-headers: content-type, x-canvasight-token`
  - `access-control-allow-private-network: true`
- 当前 widget metadata 的 CSP 只包含 `http://127.0.0.1:*` 和 `http://localhost:*`，没有当前 daemon 的精确 origin。

## 初步归因

Codex native widget 宿主可能不接受 `http://127.0.0.1:*` 这种 wildcard port CSP 写法，导致 direct widget app fetch `http://127.0.0.1:<daemonPort>` 被宿主拦截并在前端表现为 `Failed to fetch`。

## 期望结果

- widget resource metadata 动态包含当前 daemon origin，例如 `http://127.0.0.1:53208`。
- direct widget app 能 fetch daemon API。
- smoke test 覆盖 widget CSP 中的精确 daemon origin。

## 当前状态

resolved

## 处理结果

已修复。widget resource metadata 和 tool result metadata 现在会动态包含当前 daemon 的精确 origin，同时保留 localhost wildcard fallback。`widgetData` 也直接包含 `apiBaseUrl`、`canvasightHost` 和 `token`，减少前端从 URL 反推运行时数据的脆弱性。

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
- `plugins/canvasight/tests/mcp-smoke.mjs` 已断言 `open_canvasight` 后 tool `_meta` 和 resource `_meta` 都包含当前 daemon exact origin，并覆盖 PNA preflight。

## 后续风险

- 真实 Codex host 是否即时采用同一个 `ui://widget/canvasight/canvas.html` 的新 CSP 仍依赖 reload/new thread。
- 如果 host 仍然阻断 loopback fetch，需要继续检查 host 网络沙箱或改为 host tool bridge 拉取项目数据。

## Closure Criteria

- [ ] 问题原因明确
- [ ] 方案报告已回写
- [ ] 修改文件已记录
- [ ] 验证方式已记录
- [ ] 后续风险已记录
