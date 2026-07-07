---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-07 14:52
updated_at: 2026-07-07 14:52
related_issue: agent-reports/resolved/20260707-1442-development-issue-dev-daemon-start-timeout.md
related_files:
  - plugins/canvasight/scripts/dev-server.mjs
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/tests/dev-server-smoke.mjs
---

# Dev server stale version 自动重启

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260707-1442-development-issue-dev-daemon-start-timeout.md`

## Root Cause

`npm run dev` 的持久 dev server 判断只检查 `127.0.0.1:5173` 是否能返回 Canvasight 页面，没有校验 `~/.canvasight/dev-server.json` 中的 `serverVersion` 是否等于当前 package 版本。旧 `0.1.30` Vite 进程继续运行时，它的 `vite.config.ts` 中间件仍用旧 `serverVersion` 比较 daemon health；当前磁盘代码启动出的 daemon 已是 `0.1.34+`，因此旧中间件拒绝健康 daemon 并等待自己 token 对应的 daemon state，最终报 `Canvasight daemon did not start in time`。

同一 Vite 进程内多个请求同时进入 `ensureDaemonServer()` 时，还可能各自生成 token 并并发 spawn daemon，后启动的 daemon 覆盖 `daemon.json` 后会让先启动的等待者超时。

## 调研过程

1. `npm run dev:status` 显示 `5173` 正常 running，但 `~/.canvasight/dev-server.json` 记录 `serverVersion: 0.1.30`。
2. 当前 `plugins/canvasight/package.json` 已是 `0.1.34`，后续本轮提升到 `0.1.35`。
3. 当前 `~/.canvasight/daemon.json` 和 `/api/health` 显示 daemon 健康。
4. 直接 `POST http://127.0.0.1:5173/api/sessions/local/run` 复现 500：`Canvasight daemon did not start in time`。
5. 修改后 `npm run dev:status` 能显示 `stale ... serverVersion=0.1.30 expected=0.1.35`，`npm run dev` 自动重启旧 Vite；同一 API 返回 `queued`，不再 timeout。

## 可选方案

- 方案 A：只要求用户手动 `npm run dev:stop && npm run dev`。恢复快，但无法防止下次旧进程继续复用。
- 方案 B：让 `dev-server.mjs` 把 `serverVersion` 纳入健康判断，managed stale server 自动重启。稳定且符合持久 dev server 语义。
- 方案 C：在 Vite API 里增加 single-flight，避免并发 daemon spawn/token 竞争。不能单独解决 stale Vite，但能消除同类 timeout 风险。

## 推荐方案

采用方案 B + C。B 解决当前根因，C 解决排查中发现的并发风险，避免同一 Vite 进程内多个 Run 请求重复拉起 daemon。

## 实施步骤

1. `scripts/dev-server.mjs` 增加 `serverVersion` 匹配判断。
2. `npm run dev:status` 输出 `running`、`stopped` 或 `stale`，并显示实际/期望版本。
3. `npm run dev` 遇到 managed stale server 时先停止旧 Vite，再启动当前版本。
4. `vite.config.ts` 的 `ensureDaemonServer()` 增加 single-flight promise。
5. `test:dev-server` 增加 stale `dev-server.json` 场景，断言自动重启并恢复当前版本。
6. README、AGENTS、troubleshooting skill 同步说明。
7. 插件版本 bump 到 `0.1.35` 并重新安装。

## 风险与回滚

风险：如果端口 5173 上是 unmanaged 旧服务，脚本不会强杀，只会提示手动停止，避免杀错进程。回滚可还原 dev-server 版本判断和 Vite single-flight 变更，但会重新暴露旧 Vite 中间件被复用的问题。

## 处理结果

已修复。

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

- `node --check plugins/canvasight/scripts/dev-server.mjs`
- `node --check plugins/canvasight/tests/dev-server-smoke.mjs`
- `npm run typecheck`
- `npm run build`
- `npm run test:dev-server`
- `npm run test:mcp`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `npm run dev:status`
- `npm run dev`
- `curl POST http://127.0.0.1:5173/api/sessions/local/run`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list | rg canvasight`

## 后续风险

可继续改进 daemon 启动日志和历史孤儿 daemon 清理，但当前用户可见的 daemon timeout 已修复，且同进程并发启动风险已收敛。
