---
status: resolved
report_type: issue
owner: development-agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 11:47
updated_at: 2026-07-07 12:03
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260707-1203-development-solution-native-widget-direct-app.md
---

# Native widget 内 localhost iframe 被 Codex 宿主屏蔽

## 提交 Agent

main-thread

## 建议交接 Agent

development-agent

## 问题描述

用户通过 `open_canvasight` 打开 Canvasight 后，聊天内容显示“打开方式：Codex 原生组件”，但右侧原生组件区域显示系统错误：“该内容被屏蔽了。请联系网站所有者以解决此问题。”

当前 native widget shell 会在 MCP resource 中创建一个 iframe，然后把 iframe src 指向本地 daemon URL，例如 `http://127.0.0.1:57587/?sessionId=...&token=...&canvasightHost=widget`。Codex 宿主显示内容被屏蔽，说明 widget 宿主不接受这种二次 iframe 到 localhost 的页面加载方式。

## 复现方式

1. 在当前 Codex thread 调用 `open_canvasight({ projectPath: "/Users/niallyoung/Desktop/Testuse", language: "zh" })`。
2. Tool 返回 `openTarget: "codex_native_widget"`。
3. Codex 右侧原生组件区域出现 Canvasight 标签页。
4. 组件内容区显示“该内容被屏蔽了。请联系网站所有者以解决此问题。”。

## 影响范围

- native widget 主路径无法显示 Canvasight 画布。
- Run 直发 host bridge 无法使用。
- 用户会误以为插件已打开，但画布不可操作。
- browser fallback 仍可显示页面，但无法满足“原生组件直发当前 thread”的产品目标。

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`

## 证据

- `open_canvasight` 返回 `openTarget: "codex_native_widget"`、`rendering: "native-widget"`、`widget: "canvasight-canvas-widget"`。
- widget shell HTML 当前包含 `<iframe id="canvasight-frame">`。
- daemon URL 响应头没有 `X-Frame-Options` 或 `Content-Security-Policy`：
  - `content-type: text/html; charset=utf-8`
  - `content-length: 531`
- iframe sandbox 已包含 `allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-modals`。
- widget metadata 已包含 `openai/widgetCSP.connect_domains/resource_domains/frame_domains`，但宿主仍显示内容被屏蔽。

## 初步归因

优先判断为 Codex native widget 宿主不允许 widget resource 内再 iframe 本地 `127.0.0.1` 页面。当前 shell 的 iframe 架构不适合作为主路径。

## 期望结果

- native widget resource 直接承载 Canvasight React app，不再 iframe localhost。
- 前端从 widget 注入数据中读取 `sessionId`、`token`、`apiBaseUrl`、`canvasightHost`。
- API 请求指向 daemon origin。
- Run 直发通过 `window.canvasightMcp.sendFollowUpMessage` 调用 host bridge，不再依赖 iframe postMessage。

## 当前状态

resolved

## 处理结果

已修复。`open_canvasight` 的 native widget resource 不再渲染 localhost iframe，而是在 widget document 内直接承载 Canvasight React app。daemon 继续提供项目/session/API 数据，前端通过 widget 注入的 `apiBaseUrl`、`sessionId` 和 `token` 访问 daemon；Run 直发通过同一个 widget document 上的 `window.canvasightMcp.sendFollowUpMessage` 进入 Codex host bridge。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/index-CbmG8cAd.js`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`
- `AGENTS.md`
- `design.md`

## 验证方式

- `node --check plugins/canvasight/mcp/server.mjs`
- `cd plugins/canvasight && npm run typecheck`
- `cd plugins/canvasight && npm run build`
- `cd plugins/canvasight && npm run test:mcp`
- `cd plugins/canvasight && npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `plugins/canvasight/tests/mcp-smoke.mjs` 已增加断言：widget resource 包含 `#root` 和内联 app bundle，且不包含实际 `<iframe>` 标签。

## 后续风险

- 旧 Codex thread 或旧插件 cache 仍可能加载 `0.1.32` 资源；需要 reinstall 后 reload 或新开 thread 才能验证 `0.1.33`。
- 本轮 smoke 能证明资源结构和 MCP 合约，但真实 Codex host 是否允许 widget document fetch 本地 daemon，仍需用户在重开/刷新后实际打开确认。
- 直接内联 Vite bundle 依赖当前单 bundle 产物；未来如果引入 code splitting 或额外资源，需要改成 widget resource asset 化。
- `turn/start` accepted 仍不能当成 sent；真正的当前 thread 直发标准仍是 widget host bridge 或确认通知。
