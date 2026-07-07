---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 17:45
updated_at: 2026-07-07 18:05
related_files:
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/tests/dev-server-smoke.mjs
solution_report: agent-reports/resolved/20260707-1805-development-solution-run-failed-to-fetch.md
---

# Canvasight Run 点击后 Failed to fetch

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

用户在 Canvasight 页面里点击有内容节点的 Run 按钮后，页面只显示红色 toast：`Failed to fetch`。用户期望 Run 内容发送到当前 Codex thread，而不是静默失败或只显示通用 fetch 错误。

## 复现方式

1. 在当前 Codex thread 打开 Canvasight。
2. 选中或编辑一个有内容的节点。
3. 点击节点右上角 Run 或顶部 Run。
4. 页面 toast 显示 `Failed to fetch`。

## 影响范围

- Canvasight native widget / browser fallback 的 Run 请求。
- 用户无法判断失败 URL、失败原因和恢复方式。
- 可能涉及 widget runtime `apiBaseUrl`、daemon 端口、CSP connect-src、session token、旧 widget 页面持有旧 daemon origin。

## 相关文件

- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/mcp/server.mjs`

## 期望结果

- Run 请求不能只显示通用 `Failed to fetch`。
- 如果是旧 daemon origin、CSP 或网络不可达，应显示具体恢复提示。
- 当前 native widget 应能请求当前 daemon API，或者自动恢复到当前 daemon origin。

## 当前状态

resolved

## 处理结果

已修复。browser fallback 的 Run 失败不是单一前端按钮问题，而是当前 `5173` dev server 复用了未开启 Codex native delivery 的 daemon，且 Run 前没有强制补齐当前 `threadId` claim；前端网络错误也被裸露为通用 `Failed to fetch`。

## 修改文件

- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run build`
- `npm run test:mcp`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list | rg 'canvasight@canvasight-local|canvasight-local'`
- 手动确认当前 dev server `0.1.38` 运行，daemon `/api/health` 返回 `codexNativeEnabled: true`，并且当前 URL `threadId` 已 claim 到项目。

## 后续风险

native widget host bridge 仍依赖 Codex 桌面宿主能力；browser fallback 现在会通过 daemon/app-server 尝试当前 thread delivery，但如果 Codex app-server 本身拒绝 `turn/start`，仍会按既有规则转入 `await_canvasight_run` 队列并给出具体原因。
