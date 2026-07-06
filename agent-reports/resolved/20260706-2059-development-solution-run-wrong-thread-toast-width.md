---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-06 20:59
updated_at: 2026-07-06 20:59
related_issue: agent-reports/resolved/20260706-2059-development-issue-run-wrong-thread-toast-width.md
related_files:
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/dev-server-smoke.mjs
---

# 修复 Canvasight Run 错发线程和 toast 宽度

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-2059-development-issue-run-wrong-thread-toast-width.md`

## Root Cause

裸 dev 页面没有 Codex host bridge，也无法自行知道当前可见 Codex thread。旧实现的 `ensureDevDaemonSession` 在找不到 daemon project claim 时，会使用 dev server 进程的 `CODEX_THREAD_ID` 创建 session。由于 dev server 是项目级常驻进程，这个环境变量可能属于启动服务的旧 thread，而不是用户当前正在看的 thread。

Run toast 过宽是因为 `.canvas-run-toast-viewport .kit-toast` 覆盖了全局 hug-content toast 的 `width: max-content`，强制 `width: 100%`。

## 调研过程

- 读取当前可见 thread `打开画面`，确认 id 是 `019f3755-9941-7560-8eb4-8c6a937e0035`。
- 对比直接 Run 结果，确认旧链路发送到开发 thread `019f2af1-d6ed-7793-b0e3-047d83bcbfb1`。
- 由 Development Agent、Test Supervisor Agent、Design Agent 分别确认：
  - app-server accepted 不能等同当前 UI 可见。
  - dev server 进程环境不是当前 thread 证明。
  - toast 宽度来自 CSS 局部覆盖。

## 可选方案

- 方案 A：继续使用 dev server `CODEX_THREAD_ID` fallback，并只改文案。风险是继续错发到旧 thread。
- 方案 B：完全禁用浏览器 fallback direct send，只允许 queue/await。风险是用户已 claim 的浏览器页面无法直发。
- 方案 C：移除进程环境 fallback，只允许 explicit claim 或 URL `threadId` claim 后 direct send。未绑定时明确报错。

## 推荐方案

采用方案 C。它保留已 claim 浏览器页面的 direct send 能力，同时阻断裸 `5173` 向旧 thread 静默发送的根因。

## 实施步骤

1. 移除 Vite dev API 中使用 `process.env.CODEX_THREAD_ID` 自动创建 daemon session 的 fallback。
2. 增加 `/api/sessions/local/claim`，让 dev 页面可通过明确 thread id 绑定项目。
3. 前端读取 URL `threadId`，打开项目后调用 claim API。
4. 浏览器 fallback sent 文案改为“已绑定 Codex thread”，widget host bridge 保留“当前 Codex thread”。
5. 未绑定错误显示短 toast：`当前页面未绑定 Codex thread`。
6. Run toast 改回内容自适应宽度，并保留 420px 最大宽度。
7. 更新 dev-server smoke，断言无 claim 时即使有进程 `CODEX_THREAD_ID` 也必须 409。

## 风险与回滚

风险：只打开裸 `http://127.0.0.1:5173/` 且未 claim 的旧习惯会看到未绑定提示。回滚方式是恢复 Vite dev 的进程环境 fallback，但这会重新带来错发旧 thread 的风险，不建议回滚。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `README.md`
- `AGENTS.md`
- `design.md`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list | rg -n "canvasight|Canvasight"`
- 浏览器可见验证：未绑定裸 `5173` 点击 Run 显示未绑定，toast 宽度 277px，不再横向铺满。

## 后续风险

浏览器 fallback 本身仍不是 widget host bridge。若当前 thread 没有 Canvasight MCP tools，只能通过带 `threadId` 的 URL 或显式 claim 绑定；否则前端必须继续阻止 false-positive sent。
