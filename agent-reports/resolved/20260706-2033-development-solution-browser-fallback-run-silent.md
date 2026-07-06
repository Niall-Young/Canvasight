---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-06 20:33
updated_at: 2026-07-06 20:33
related_issue: agent-reports/resolved/20260706-2018-development-issue-browser-fallback-run-silent.md
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/styles/app.css
---

# 解决方案：浏览器 fallback Run 明示排队状态

## 负责 Agent

Development Agent，主线程集成；Test Supervisor Agent 提供验证清单。

## 对应问题

`agent-reports/resolved/20260706-2018-development-issue-browser-fallback-run-silent.md`

## Root Cause

用户当前实际使用的是裸 `127.0.0.1:5173` 浏览器 fallback，而不是 Codex native widget。该页面没有 widget host bridge，不能直接把 Run 作为 follow-up message 发送到当前 Codex thread。此前前端只写 `setStatus`，但顶部状态区已被移除，导致 fallback 排队或失败状态不可见。

## 调研过程

- 复查当前截图和页面 URL，确认是 `127.0.0.1:5173` browser fallback。
- 复查 `canvasight-run` contract，确认 browser/dev 页面只能队列化或 await，不应声称 sent。
- Playwright 首次点击暴露旧 daemon/dev server 状态混乱；重启 dev server 后 `/api/sessions/local/run` 返回 `queued` 和 `native_direct_requires_explicit_opt_in`。
- DOM 验证 `.canvas-run-toast-viewport` 出现 fallback 提示。

## 可选方案

- 方案 A：在 browser fallback 上继续尝试 app-server native direct。拒绝，因为之前已证明 isolated app-server 会出现 false sent。
- 方案 B：用虚拟点击/剪贴板把 Markdown 塞进 Codex 输入框。拒绝，违反产品边界。
- 方案 C：native widget 直发；browser fallback 只排队并给出可见、可操作状态。采用。

## 推荐方案

采用方案 C。正常入口仍是 `render_canvasight_canvas_widget`；browser fallback 点击 Run 后显示明确 toast，说明不会直发，并提示 `await_canvasight_run` 或 native widget 重新打开。

## 实施步骤

1. 新增 Run feedback toast 状态，复用现有 Toast 组件。
2. 调整 `runNode`：widget 成功才显示 sent；非 widget queued 状态显示 browser fallback 文案。
3. 新增中英文文案。
4. 收紧 `canvasight-open`、`canvasight-run`、troubleshooting 文档。
5. 修正 dev server state version 从 package.json 读取。
6. Bump 插件版本到 `0.1.27` 并重新安装。

## 风险与回滚

回滚方式是还原本轮前端 toast、skill 文案和版本 bump。残余风险是旧 Codex thread 不热刷新 MCP tool descriptor；该风险无法由网页内按钮修复，必须 reload 或新开 thread。

## 处理结果

已修复。

## 修改文件

- `README.md`
- `agent-reports/QUEUE.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/scripts/dev-server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/ui/toast.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`

## 验证方式

- `npm run typecheck`：通过。
- `npm run build`：通过，保留 Vite chunk size warning。
- `npm run test:mcp`：通过。
- `npm run test:dev-server`：通过。
- 插件校验：通过。
- Playwright：点击 5173 fallback 节点 Run 后，toast 显示“当前是浏览器兜底页面，Run 已排队但不会直发；请用 await_canvasight_run 接收，或用 native widget 重新打开”。

## 后续风险

当前旧 thread 如果没有 `render_canvasight_canvas_widget`，不能通过本轮前端改动直接变成 native widget。需要新开或 reload Codex thread。
