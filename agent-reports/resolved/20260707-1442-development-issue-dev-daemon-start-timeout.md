---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: high
created_at: 2026-07-07 14:42
updated_at: 2026-07-07 14:52
related_files:
  - plugins/canvasight/scripts/dev-server.mjs
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/tests/dev-server-smoke.mjs
solution_report: agent-reports/resolved/20260707-1452-development-solution-dev-daemon-start-timeout.md
---

# 浏览器 fallback 启动 daemon 超时

## TL;DR

`127.0.0.1:5173` 浏览器 fallback 正在复用旧 `0.1.30` Vite dev server，导致 Run API 使用旧中间件并报 `Canvasight daemon did not start in time`。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

用户在 Codex in-app browser 打开 `http://127.0.0.1:5173/?threadId=...` 后点击节点 Run，页面 toast 显示 `Canvasight daemon did not start in time`。当前页面是浏览器 fallback/dev page，不是 native widget，因此 Run 依赖 Vite dev API 和 Canvasight daemon。

## 现象

- `npm run dev:status` 显示 `running http://127.0.0.1:5173 pid=25490`。
- `~/.canvasight/dev-server.json` 的 `serverVersion` 是 `0.1.30`。
- 当前 `plugins/canvasight/package.json` 和 daemon 是 `0.1.34`。
- 直接请求 `POST http://127.0.0.1:5173/api/sessions/local/run` 返回 500 和 `Canvasight daemon did not start in time`。
- `http://127.0.0.1:59066/api/health` 返回健康的 `0.1.34` daemon。

## 复现方式

1. 保留旧 `127.0.0.1:5173` 持久 dev server。
2. 升级插件代码和 daemon 到新版本。
3. 打开 `http://127.0.0.1:5173/?threadId=<current-thread-id>`。
4. 点击有内容节点的 Run。

## 影响范围

- 浏览器 fallback/dev page 的 Run API。
- `npm run dev` 对旧 dev server 的复用策略。
- 用户在 native `open_canvasight` 不可用时的兜底路径。

## 证据

- `~/.canvasight/dev-server.json`：`serverVersion: "0.1.30"`。
- `plugins/canvasight/package.json`：`version: "0.1.34"`。
- `~/.canvasight/daemon.json`：`serverVersion: "0.1.34"`。
- `POST /api/sessions/local/run` 响应：`{"error":"Canvasight daemon did not start in time"}`。

## 初步归因

`scripts/dev-server.mjs start` 只检查 `pluginRoot`、`origin` 和页面健康状态，没有把 `serverVersion` 不一致视为 stale。旧 Vite 进程启动时加载的 `vite.config.ts` API 中间件不会随插件 runtime 版本自动更新，导致当前页面继续使用旧 daemon 拉起和 Run 路由逻辑。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- `npm run dev` 是否应在 `serverVersion` 不一致时自动停止旧 managed Vite 并重启？
- `status` 是否需要暴露 stale 版本，避免误判为正常 running？
- `test:dev-server` 是否应覆盖 stale managed dev server 状态文件和自动重启？

## 相关文件

- `plugins/canvasight/scripts/dev-server.mjs`
- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/tests/dev-server-smoke.mjs`

## 期望结果

旧 dev server 不能跨 Canvasight runtime 版本继续复用。版本不一致时，`npm run dev` 自动重启 managed server，`dev:status` 明确提示 stale，浏览器 fallback Run 不再因为旧中间件报 daemon 启动超时。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。managed dev server 现在会把 `serverVersion` 纳入健康判断；版本不一致时 `npm run dev` 自动重启旧 Vite 进程。Vite dev API 也增加了 daemon 启动 single-flight，避免并发 Run 互相覆盖 token。

## 修改文件

- `plugins/canvasight/scripts/dev-server.mjs`
- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`
- `README.md`
- `AGENTS.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:dev-server`
- `npm run test:mcp`
- plugin validation
- `npm run dev:status`
- `curl POST http://127.0.0.1:5173/api/sessions/local/run`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list | rg canvasight`

## 后续风险

历史遗留的旧 daemon 进程可能仍存在，但当前 `~/.canvasight/daemon.json` 指向 `0.1.35` daemon，且新 Vite 进程不会再并发拉起多个 daemon。后续如需进一步收敛，可增加 daemon 启动日志和孤儿 daemon 清理策略。
