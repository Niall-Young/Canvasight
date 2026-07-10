---
status: resolved
report_type: issue
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-10 10:52
updated_at: 2026-07-10 10:56
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260710-1056-development-solution-direct-widget-metadata-bootstrap.md
---

# Direct host metadata 未触发 Canvasight native widget bootstrap

## TL;DR

Codex native host 可将隐藏 tool metadata 直接放入 `window.openai.toolResponseMetadata`，旧 bridge 只接受 MCP envelope，因此丢失 session URL，React app 从未启动并永久显示 `Opening Canvasight...`。

## 发现者

Development Agent

## 提交 Agent

Development Agent

## 建议交接 Agent

Development Agent

## 问题描述

线程 `019f49ee-40da-7252-ba17-fa4089c523ed` 的 `open_canvasight` 在 294ms 内成功，daemon 和 resource read 都成功，raw tool result 的 `_meta.widgetData` 完整；但原生 widget 只显示 opening 状态。widget bootstrap 没有把 host 的 direct metadata 识别为可启动 session。

## 现象

- native widget 已实例化但不加载 React 画布。
- tool result 有完整 `widgetData`，public structured content 则按安全合同不含 localhost session URL。
- browser fallback 未参与，不能作为修复路径。

## 复现方式

1. 让 `window.openai.toolResponseMetadata` 直接为 session data（`url` 或 `browserUrl`），且 `toolOutput` 只有 public content。
2. 或让 `toolResponseMetadata` 为 `{ widgetData: { browserUrl: ... } }`。
3. 原逻辑不插入 `canvasight-app-module`，widget 卡在 opening 状态。

## 影响范围

- 使用 direct metadata 注入形式的 Codex native widget 无法展示或操作画布。
- Run bridge 也无法到达可交互 UI。

## 证据

- `toolResultFromOpenAiGlobals()` 原先只在 canonical object 包含 `_meta`、`structuredContent` 或 `content` 时返回；direct metadata 不满足该条件。
- `payloadFromToolResult()` 原先也不优先解包顶层 `widgetData`。
- 新增 smoke 在修复前于 app module 注入断言失败，修复后三种 host shape 均成功挂载 module。

## 初步归因

bridge 把 host metadata 当作唯一 MCP result envelope 解析，未兼容 Apps host 提供的 direct metadata / direct session data 形态。

## 交付给哪个 Agent

Development Agent

## 期望结果

native widget 不依赖某一种 metadata envelope；只要 direct 或 nested widget session data 含 URL，就完成 Canvasight bootstrap，保持 native host bridge。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已兼容 direct `widgetData`、`_meta.widgetData` 和 direct `url`/`browserUrl` metadata，版本同步至 `0.1.51`。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- runtime version files

## 验证方式

- `npm run test:mcp`
- plugin validator
- server/test Node syntax checks

## 后续风险

当前安装的 `0.1.50` widget resource 不会热刷新；需要 reinstall 后 reload 或新任务，才能验收真实 Codex host。
