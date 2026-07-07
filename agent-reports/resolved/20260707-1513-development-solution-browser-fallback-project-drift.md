---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-07 15:13
updated_at: 2026-07-07 15:13
related_issue: agent-reports/resolved/20260707-1501-development-issue-browser-fallback-project-drift.md
---

# 修复浏览器 fallback 项目路径漂移

## 负责 Agent

Development Agent

## Root Cause

Generic browser fallback 只打开 `http://127.0.0.1:5173/?threadId=...`。`threadId` 只能表示当前 Codex 线程，不能表示当前项目。前端启动时没有读取 URL `projectPath`，因此回退到 dev server 的默认项目 `/Users/niallyoung/Desktop/Canvasight`，造成不同项目都显示同一份 Canvasight repo 画布。

## 调研过程

- 检查截图 URL，确认只有 `threadId`，没有 `sessionId`、`token` 或 `projectPath`。
- 检查 `src/App.tsx` 初始化逻辑，发现启动项目路径来自 `session.projectPath || defaultProjectPathFromBrowser()`。
- 检查 `src/lib/canvasightApi.ts`，发现只集中解析 `sessionId`、`token`、`threadId`，没有 `projectPath` query 支持。
- 检查 dev server 默认项目，确认默认路径会落到 Canvasight repo。
- 让 Test Supervisor Agent 给出验证口径：必须证明 `?threadId=...&projectPath=/Users/niallyoung/Desktop/Testuse` 的 session、claim、Run 归属都落到 Testuse。

## 可选方案

- 方案 A：只更新 skill，让 generic fallback 永远生成 `threadId + projectPath` URL。
- 方案 B：前端也支持 `projectPath` query，并阻止 thread-only fallback 自动打开默认项目。
- 方案 C：完全禁用 generic dev fallback，只允许 MCP browser fallback 的 `sessionId/token` URL。

## 推荐方案

采用方案 B，同时更新 skill、README、AGENTS 和版本号。这样新链接能打开正确项目，旧的 `?threadId=...` 链接也不会继续错误绑定默认 Canvasight 项目。

## 实施步骤

- 在 `canvasightApi.ts` 增加 `projectPathFromUrl()` 和 `isThreadOnlyFallbackUrl()`。
- 在 `App.tsx` 初始化时优先使用 URL `projectPath`，并在 thread-only fallback 下跳过 `session.projectPath/defaultProjectPath`。
- 更新 `canvasight-open` 和 troubleshooting skill 文档，要求 generic dev fallback 必须携带 URL-encoded absolute `projectPath`。
- 更新 README 与 AGENTS 里的 dev fallback 说明。
- 将插件版本从 `0.1.35` 升到 `0.1.36`。

## 风险与回滚

- 风险：浏览器 fallback 仍然没有 native widget host bridge，Run 仍是队列语义。
- 风险：旧的 thread-only URL 会停在打开项目入口，需要重新用带 `projectPath` 的 URL 打开。
- 回滚：撤销 `0.1.36` 的前端 URL 解析改动与文档更新，并恢复 `0.1.35` 版本号。

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:dev-server`
- `npm run test:mcp`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `npm run dev` 自动重启 stale `0.1.35` dev server 到 `0.1.36`。
- Codex in-app browser 打开 `http://127.0.0.1:5173/?threadId=test-thread-project-drift&projectPath=%2FUsers%2Fniallyoung%2FDesktop%2FTestuse` 后，页面内容为 Testuse 的个人网站画布。
- `curl http://127.0.0.1:5173/api/sessions/local` 返回 `/Users/niallyoung/Desktop/Testuse`。
- daemon `/api/sessions/resolve` 返回 Testuse 项目绑定 `threadId: test-thread-project-drift`。
- 打开只有 `?threadId=test-thread-only-no-project` 的旧 URL，不再自动打开 Canvasight repo 默认画布。

## 处理结果

已修复。

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

## 后续风险

如果当前 Codex thread 没有暴露 native Canvasight MCP widget 工具，浏览器 fallback 的 Run 仍不会直接出现在聊天输入流里，而是进入 `await_canvasight_run` 队列。这是 host bridge 能力边界，不是本次项目路径漂移问题。
