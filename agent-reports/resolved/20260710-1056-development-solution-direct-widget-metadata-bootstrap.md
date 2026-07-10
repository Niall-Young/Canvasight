---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-10 10:52
updated_at: 2026-07-10 10:56
related_issue: agent-reports/resolved/20260710-1056-development-issue-direct-widget-metadata-bootstrap.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# 兼容 Codex host 的 direct widget metadata bootstrap

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260710-1056-development-issue-direct-widget-metadata-bootstrap.md`

## Root Cause

`toolResultFromOpenAiGlobals()` 将 `toolResponseMetadata` 视为 MCP result envelope，漏掉顶层 `widgetData` 或 direct session URL。由于 public `toolOutput` 必须隐藏 localhost URL，后续没有可用 URL 调用 `setFrameSource()`。

## 调研过程

核对真实 native open 的 daemon/resource 成功证据、raw result metadata，以及 widget shell 的 initial globals 解析。通过 harness 构造 direct session 与 direct metadata wrapper，复现 app module 未插入；完整 MCP envelope 原本正常，说明故障是 metadata shape 而不是 daemon、CSP、module script 或 browser fallback。

## 可选方案

- 方案 A：将 daemon URL 放回 public structured content。违反 native output 安全合同，不采用。
- 方案 B：改走 browser fallback。丢失 native Run bridge，不采用。
- 方案 C：在 widget shell 兼容 direct 和 nested session metadata。采用。

## 推荐方案

用 `hasWidgetSessionUrl()` 检测 direct `url`/`browserUrl`、`widgetData`、`_meta.widgetData`；用 `payloadFromToolResult()` 优先解包顶层 `widgetData`。这样 metadata 保持 widget-only，canvas 仍通过 native host bridge 运行。

## 实施步骤

1. 新增可识别 direct/nested session URL 的 helper。
2. 放宽 initial global result 的 canonical 接受条件。
3. 优先从 direct `widgetData` 取得 payload。
4. 补三种 initial host globals 的 module bootstrap smoke。
5. 同步 runtime 版本到 `0.1.51`。

## 风险与回滚

只接受含 session URL 的 metadata，不会将普通 public output 误视为 session。回滚会重新阻断 direct metadata host；不需要或不应降级为 browser fallback。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run test:mcp` 通过，覆盖 MCP envelope、direct session metadata、direct metadata `widgetData` wrapper。
- plugin validator 通过。
- `node --check` server 和 smoke 通过。

## Documentation Decision

这是既有 native opening workflow 的 host compatibility 修复，没有增加用户命令、界面布局或配置项；README、design.md、AGENTS.md 和 skills 无需更新。由 main thread 在 integration summary 中复核该决定。

## 后续风险

必须在重装 `0.1.51` 后使用 reload/new task 的真实 Codex native host 验收；旧 `0.1.50` widget 不会热更新。
