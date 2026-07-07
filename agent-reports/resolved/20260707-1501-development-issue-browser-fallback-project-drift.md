---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 15:01
updated_at: 2026-07-07 15:13
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-open/references/open-workflow.md
solution_report: agent-reports/resolved/20260707-1513-development-solution-browser-fallback-project-drift.md
---

# 浏览器 fallback 打开默认 Canvasight 项目

## TL;DR

当 Canvasight MCP native widget 工具未暴露时，通用浏览器 fallback 只打开 `http://127.0.0.1:5173/?threadId=...`，没有携带 `projectPath/sessionId`，导致前端回退到默认 `/Users/niallyoung/Desktop/Canvasight` 项目，看起来每个项目都打开同一份画布。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

用户在不同 Codex 项目里打开 Canvasight 后，仍看到 Canvasight repo 自己的画布内容，并且点击 Run 仍提示浏览器 fallback queue。截图 URL 是 `http://127.0.0.1:5173/?threadId=019f3b5c-...`，没有 `sessionId`、`token` 或 `projectPath`。

## 现象

- 页面 URL 只有 `threadId`。
- 前端 `defaultProjectPathFromBrowser()` 使用 `VITE_CANVASIGHT_DEFAULT_PROJECT_PATH`。
- Vite dev server 默认项目路径是 `path.resolve(__dirname, "../..")`，即 `/Users/niallyoung/Desktop/Canvasight`。
- 本机发现 `.scatter` 项目包括 `/Users/niallyoung/Desktop/Canvasight/.scatter` 和 `/Users/niallyoung/Desktop/Testuse/.scatter`，但无项目路径 URL 时只能打开默认 Canvasight。

## 复现方式

1. 在非 Canvasight 项目 thread 中打开通用 browser fallback。
2. URL 只携带 `?threadId=<current-thread-id>`。
3. 页面加载后看到 Canvasight repo 的 `Page 1 / 新建任务 1` 画布。
4. 点击 Run 进入 fallback queue，且 Markdown projectPath 为 Canvasight。

## 影响范围

- native Canvasight MCP tools 不暴露或 transport closed 时的浏览器 fallback。
- 当前项目绑定、Run payload 的 `projectPath`、`.scatter/scatter.json` 读写目标。
- 用户对“当前项目画布”的核心信任。

## 证据

- 截图 URL：`http://127.0.0.1:5173/?threadId=...`。
- `plugins/canvasight/vite.config.ts` 默认 projectPath：`../..`。
- `plugins/canvasight/src/App.tsx` 初始化逻辑优先 session/default project，没有读取 URL projectPath。
- `plugins/canvasight/src/lib/canvasightApi.ts` 只读取 `sessionId`、`token`、`threadId`，没有 `projectPathFromUrl()`。

## 初步归因

浏览器 fallback 被设计成 dev page 兜底，但 generic fallback instruction 只保留 thread id，没有保留项目路径。前端也没有 `projectPath` query 支持，因此只能走默认项目路径，造成跨项目内容漂移。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 前端是否应支持 `?projectPath=<absolute-path>` 并优先打开该项目？
- generic fallback skill 是否应要求 URL 同时携带 `threadId` 和当前工作区 `projectPath`？
- 测试如何覆盖 URL projectPath 优先级，避免未来回归？

## 相关文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`

## 期望结果

通用 `5173` browser fallback 在 URL 携带 `projectPath` 时必须打开该项目，claim 当前 thread 也必须绑定该项目。Canvasight skill 在 MCP tools 不可用时应生成 `http://127.0.0.1:5173/?threadId=<id>&projectPath=<absolute-project-path>`，不能只打开默认 Canvasight repo。

## Closure Criteria

- [ ] 问题原因明确
- [ ] 方案报告已回写
- [ ] 修改文件已记录
- [ ] 验证方式已记录
- [ ] 后续风险已记录

## 当前状态

assigned

## 处理结果

已修复。前端已支持 URL `projectPath` 优先打开项目，并阻止只有 `threadId` 的 generic fallback 自动打开/claim 默认 Canvasight repo 项目。

## 修改文件

- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `README.md`
- `AGENTS.md`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:dev-server`
- `npm run test:mcp`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- Codex in-app browser 打开 `http://127.0.0.1:5173/?threadId=test-thread-project-drift&projectPath=%2FUsers%2Fniallyoung%2FDesktop%2FTestuse`，页面内容来自 Testuse。
- `curl http://127.0.0.1:5173/api/sessions/local` 返回 `projectPath: /Users/niallyoung/Desktop/Testuse`。
- daemon `/api/sessions/resolve` 返回 Testuse claim：`threadId: test-thread-project-drift`。
- Codex in-app browser 打开只有 `?threadId=test-thread-only-no-project` 的旧 URL，页面停在打开项目入口，没有自动打开 Canvasight repo 默认画布。

## 后续风险

浏览器 fallback 仍然不是 native widget，Run 仍会进入 `await_canvasight_run` 队列；这个修复只解决项目路径漂移和错误默认项目绑定，不把 fallback 伪装成直接发送。
