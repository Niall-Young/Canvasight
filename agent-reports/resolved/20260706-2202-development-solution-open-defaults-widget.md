---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-06 22:02
updated_at: 2026-07-06 22:02
related_issue: agent-reports/resolved/20260706-2150-development-issue-open-defaults-browser-not-widget.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
  - plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md
  - README.md
  - AGENTS.md
---

# 解决 Canvasight 默认打开入口未使用 native widget

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-2150-development-issue-open-defaults-browser-not-widget.md`

## Root Cause

Canvasight 已经实现 native widget bridge，但公开默认入口 `open_canvasight` 仍返回 browser fallback URL。普通 `127.0.0.1:5173` 页面没有 Codex widget host bridge，前端 `canSendFollowUpMessage()` 为 false，只能把 Run payload 放入 daemon 队列。上一轮把 false sent 修成 queued 是正确降级，但没有让默认入口走 direct delivery path。

## 调研过程

- 检查 `server.mjs`，确认 `render_canvasight_canvas_widget` 才带 `openai/outputTemplate`，`open_canvasight` 只返回 `codex_in_app_browser`。
- 检查前端 `canvasightApi.canSendFollowUpMessage()`，确认只有 iframe + `canvasightHost=widget` 条件下才会调用 `sendFollowUpMessage()`。
- 检查 `@modelcontextprotocol/ext-apps` 类型，确认 `sendMessage({ role: "user", content })` 参数结构正确，桥调用本身不是主要根因。
- 复核 Agent Team 回执：Product、Development、Test、Skill、Customer Support、Project Management 均要求默认入口改为 widget，并将 browser fallback 显式化。

## 可选方案

- 方案 A：给 `open_canvasight` 增加 `openMode: "widget" | "browser"`，默认 widget。
- 方案 B：让 `open_canvasight` 固定默认 widget，新增 `open_canvasight_browser_fallback` 作为显式浏览器入口。

## 推荐方案

采用方案 B。原因是 tool descriptor 的 `openai/outputTemplate` 通常是宿主决定是否渲染 widget 的关键元数据；如果同一工具还承担 browser fallback，容易造成 descriptor 与返回语义冲突。将 browser fallback 拆成独立工具后，默认入口语义更稳定。

## 实施步骤

1. 将 `open_canvasight` 改为调用 `toolRenderCanvasightCanvasWidget()`。
2. 新增 `open_canvasight_browser_fallback` 保留旧 browser URL fallback 行为。
3. 给 `open_canvasight` 和 `open_canvasight_recent_project` tool descriptor 增加 widget `_meta`。
4. 更新 MCP smoke，断言 `open_canvasight` 默认 `codex_native_widget`，fallback 工具才返回 `codex_in_app_browser`。
5. 同步 Skill、README、AGENTS 和版本号到 `0.1.31`。
6. 重装 repo-local plugin，确认 `canvasight@canvasight-local 0.1.31`。

## 风险与回滚

风险：旧 Codex thread 可能继续使用旧插件 cache，必须 reload 或新开 thread 才会看到新的 tool descriptor。已打开的 `127.0.0.1:5173` 页面仍然是裸网页，无法直接获得 widget host bridge。

回滚：恢复 `open_canvasight` 调用 browser fallback，并撤回 `open_canvasight_browser_fallback` tool。但这会重新引入用户默认入口无 direct delivery 的问题。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `plugins/canvasight/skills/canvasight-graph-writer/references/graph-writing.md`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `README.md`
- `AGENTS.md`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260706-2150-development-issue-open-defaults-browser-not-widget.md`

## 验证方式

- `npm run typecheck` 通过。
- `npm run test:mcp` 通过。
- `npm run build` 通过。
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight` 通过。
- `codex plugin add canvasight@canvasight-local` 安装到 cache `0.1.31`。
- `codex plugin list` 显示 `canvasight@canvasight-local 0.1.31`。

## 后续风险

当前已打开的裸 `127.0.0.1:5173` 页面仍只能 queue。用户需要从当前或新 Codex thread 重新调用 `open_canvasight`，让 Codex 渲染 native widget 后，Run 才能走 host bridge。
