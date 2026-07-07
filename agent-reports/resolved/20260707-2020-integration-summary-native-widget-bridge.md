---
status: resolved
report_type: integration-summary
owner: main-thread
created_by: main-thread
priority: critical
created_at: 2026-07-07 20:20
updated_at: 2026-07-07 20:20
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/package.json
  - plugins/canvasight/.codex-plugin/plugin.json
  - README.md
  - AGENTS.md
  - design.md
---

# Native Widget Bridge 修复集成总结

## 本轮目标

- 修复 `open_canvasight` 正常路径被 Codex 误渲染为 `127.0.0.1` 网页预览的问题。
- 保证 native Run 成功路径只依赖 MCP App widget host bridge `sendMessage`，browser/dev fallback 只用于诊断或队列。
- 同步版本到 `0.1.40` 并重装插件，避免旧 `0.1.39` cache 或 stale dev server 继续影响验证。

## Agent 状态

- Product Agent：主线程代执行；确认产品契约仍是 native widget 作为正常入口，browser fallback 不参与 Run 成功路径。
- Design Agent：主线程代执行；没有调整可见布局，用户可见变化是错误入口被阻断。
- Development Agent：主线程代执行；完成 MCP result metadata、output schema、version bump。
- Test Supervisor Agent：主线程代执行；完成 markdown/typecheck/build/mcp/dev-server/plugin validation/重装验证。
- Customer Support Agent：主线程代执行；README 已同步 0.1.40 native/fallback 说明。
- Design Standards Expert：主线程代执行；design.md 已同步 native open 结果不公开 localhost URL 的设计规则。
- Development Standards Lead：主线程代执行；AGENTS.md 已同步 0.1.40 native open 契约。
- Project Management Agent：主线程代执行；待最终 stage/commit。
- Skill Expert Agent：主线程代执行；canvasight-open 与 troubleshooting skill 说明已同步。

## Agent 输入

- Product Agent：正常入口必须是 MCP App widget，不能把 `127.0.0.1` 当成可成功 Run 的入口。
- Design Agent：无需新增 UI；保留现有明确错误状态和诊断语义。
- Development Agent：native open public `structuredContent/text` 不允许包含 daemon URL/token/origin；这些只允许在 `_meta.widgetData`。
- Test Supervisor Agent：MCP smoke 必须覆盖 native result、fallback result、widget HTML bridge 关键字。
- Customer Support Agent：README 需要说明 0.1.40、reload/new thread、fallback 只诊断。
- Design Standards Expert：design.md 需要记录 native open 不应露出 localhost 预览。
- Development Standards Lead：AGENTS.md 需要记录 durable runtime 契约。
- Project Management Agent：中文 conventional commit。
- Skill Expert Agent：技能说明不应引导把 browser fallback 当正常入口。

## 报告状态变更

- 新增 `agent-reports/resolved/20260707-2020-integration-summary-native-widget-bridge.md`。
- `agent-reports/QUEUE.md` 已追加本轮集成记录。
- `agent-reports/open/20260707-1127-development-issue-current-thread-mcp-transport-closed.md` 保持 open；它描述的是当前已打开 Codex thread 可能需要 reload/new thread 才能加载新 MCP descriptor。

## 已解决

- Native open tools 的公开输出不再包含 `url`、`browserUrl`、`origin`、`apiBaseUrl`、`token`。
- Native open tools 保留 `openai/outputTemplate`、`ui.resourceUri`、`ui/resourceUri`、`openai/widgetAccessible`，并把 daemon 连接数据放入 `_meta.widgetData`。
- Browser fallback 继续公开 URL，但没有 native widget output template metadata。
- MCP smoke 覆盖 widget MIME、内联 HTML、无 module script、无 iframe、`sendFollowUpMessage` 与 `mcpApp.sendMessage`。
- 版本同步到 `0.1.40`，插件已重装，stale `0.1.39` managed dev server 已重启为 `0.1.40`。

## 未解决

- 已经打开的 Codex thread 不会热刷新刚重装的 MCP tools；真实 native widget 点击验收仍需要用户在 new/reloaded Codex thread 中调用 `open_canvasight`。

## 风险

- 如果 new/reloaded thread 仍没有 `ui/initialize` 握手，下一步应继续修 widget descriptor/host 承载契约，不能回退到 browser fallback 或 app-server `turn/start` 成功路径。

## 下一轮分派

- 如真机仍失败，Development Agent 定位 Codex Desktop 是否把 tool result 作为 MCP App widget 承载；Test Supervisor Agent 记录 native widget 诊断里的 `canSendFollowUpMessage`。

## 已完成改动

- MCP server 拆分 native widget output schema 与 browser fallback output schema。
- Native widget tool result 改为 public widget state + `_meta.widgetData` 私有连接数据。
- MCP smoke 新增 native public result 泄露检查和 widget bridge HTML 检查。
- README、AGENTS、design.md、相关 Canvasight skills 同步 0.1.40 契约。

## 处理结果

已完成

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `README.md`
- `AGENTS.md`
- `design.md`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260707-2020-integration-summary-native-widget-bridge.md`

## 验证方式

- `npm run test:markdown`
- `npm run typecheck`
- `npm run build`
- `npm run test:mcp`
- `npm run test:dev-server`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`
- `npm run dev:status`

## 验证记录

- `npm run test:markdown` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run test:mcp` passed.
- `npm run test:dev-server` passed.
- Plugin validation passed.
- `codex plugin add canvasight@canvasight-local` installed cache `0.1.40`.
- `codex plugin list` shows `canvasight@canvasight-local installed, enabled 0.1.40`.
- `npm run dev:status` first reported stale `serverVersion=0.1.39 expected=0.1.40`; `npm run dev` restarted it; final status is `running ... serverVersion=0.1.40`.

## 回写状态

- `agent-reports/QUEUE.md` 已更新。
- 本轮没有新增 issue report。
- 本轮 integration summary 已写入。

## 未解决 / 后续风险

- New/reloaded Codex thread 是真机验收前提；当前已打开 thread 可能仍持有旧 MCP descriptor。

## Git 状态

- branch: main
- commit: pending
- worktree: dirty before final stage/commit
