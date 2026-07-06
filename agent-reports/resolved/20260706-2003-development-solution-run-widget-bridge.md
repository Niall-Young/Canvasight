---
status: resolved
report_type: solution
owner: development-agent
created_by: development-agent
priority: critical
created_at: 2026-07-06 20:03
updated_at: 2026-07-06 20:03
related_issue: agent-reports/resolved/20260706-1935-development-issue-run-widget-bridge.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md
  - README.md
  - AGENTS.md
  - design.md
---

# Canvasight Run Widget Bridge 解决方案

## 负责 Agent

development-agent

## 对应问题

`agent-reports/resolved/20260706-1935-development-issue-run-widget-bridge.md`

## Root Cause

Canvasight 之前默认打开 localhost/in-app browser 页面。普通网页没有 Codex native widget 的 host bridge，因此无法像 Cowart 一样调用 `app.sendMessage()` 把 Run 内容作为当前 Codex thread 的 follow-up message 发送出去。旧的 app-server `turn/start` 路线也可能在隔离环境中返回 false positive，不能作为当前 Desktop thread 可见发送的可靠证据。

## 调研过程

- 对照 Cowart 仓库，确认它通过 MCP `openai/outputTemplate` 渲染 native widget，并在 widget 中使用 `@modelcontextprotocol/ext-apps` 的 `App.sendMessage()`。
- 检查 `@modelcontextprotocol/ext-apps` 本地类型，确认 `ui/message` 只支持 `role: "user"` 和 content blocks，不直接提供 Plan/Goal 模式切换字段。
- 检查 Canvasight 现有 Run 链路，确认 payload 生成、daemon queue 和 `await_canvasight_run` 可用，缺的是 native widget host bridge。
- 复核前端 iframe 识别，避免普通 iframe 或裸 dev 页面误判为 widget。

## 可选方案

- 方案 A：继续增强 browser URL + `claim_canvasight_thread` + queue。能保留兼容，但无法满足“点击 Run 直接发送到当前 thread”的体验。
- 方案 B：把整个 Vite bundle 内联为 MCP widget。最接近 Cowart，但会大规模改构建/资源加载，风险高。
- 方案 C：新增 native widget 外壳，复用现有 daemon 页面作为 iframe，并在 widget 外壳中用 host bridge 转发 Run。改动可控，保留现有 UI 和 daemon 能力。

## 推荐方案

采用方案 C。Canvasight 默认通过 `render_canvasight_canvas_widget` 打开 native widget；widget 外壳负责连接 Codex host bridge，并把内层 Canvasight iframe 的 Run `postMessage` 转为 `app.sendMessage()`。浏览器 URL 和 `await_canvasight_run` 保留为 fallback。

## 实施步骤

1. 新增 MCP resource `ui://widget/canvasight/canvas.html`，通过 `resources/list` 和 `resources/read` 暴露 widget HTML。
2. 新增 `render_canvasight_canvas_widget` tool，并在 tool descriptor/result `_meta` 中声明 `openai/outputTemplate` 和 `openai/widgetAccessible`。
3. widget HTML 加载 `@modelcontextprotocol/ext-apps/app-with-deps`，创建 `App`，监听 tool result，设置 iframe URL，并处理 `canvasight:send-follow-up`。
4. 前端在 `canvasightHost=widget` iframe 中点击 Run 时，先调用 `prepareWidgetRun` 完成 Agent Team 预处理，再向 parent widget 发送 follow-up 请求。
5. 如果 widget bridge 失败，前端回退到原有 `/run` queued fallback。
6. 更新 MCP smoke、README、AGENTS、design baseline 和 Canvasight skills。
7. 将插件版本同步 bump 到 `0.1.26` 并重新安装 repo-local 插件。

## 风险与回滚

- 风险：真实 Codex widget host 对 localhost iframe 的 CSP 支持需要新线程或 reload 后端到端确认。已在 widget meta 中补 `frameDomains`，并保留 browser fallback。
- 风险：widget `sendMessage()` 只保证发送 Markdown，不保证 host 原生 Plan/Goal 切换。文档已明确 Plan/Goal 原生状态仍需 fallback 状态判断。
- 回滚：恢复 `open_canvasight` 为默认入口，移除 `render_canvasight_canvas_widget` tool/resource，并将前端 Run 直接走 `/run` queued fallback。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `plugins/canvasight/skills/canvasight/SKILL.md`
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

当前线程不会热刷新新的 MCP tool/resource。需要新开 Codex thread 或 reload 后调用 `render_canvasight_canvas_widget` 做真实点击 Run 验证。
