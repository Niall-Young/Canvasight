---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-07 18:05
updated_at: 2026-07-07 18:05
related_issue: agent-reports/resolved/20260707-1745-product-issue-run-failed-to-fetch.md
---

# 修复 Canvasight Run Failed to fetch

## 负责 Agent

Development Agent

## Root Cause

当前复现页面是 `http://127.0.0.1:5173/?threadId=...` browser fallback，不是 native widget。这个路径依赖 Vite dev server 将 `local` session 转发给 daemon。问题由三层叠加导致：

1. dev server 启动 daemon 时默认没有设置 `CANVASIGHT_CODEX_NATIVE=1`，daemon 的 `nativeCodexEnabled()` 为 false。
2. dev server 健康检查只比较版本和 pluginRoot，没有比较 daemon 的 native delivery 开关，因此会长期复用一个不可发送的旧 daemon。
3. Run 前只依赖初始化阶段的 claim；如果初始化 claim 失败或未完成，Run 会落到未绑定的 `local` session。前端网络错误没有携带目标 URL 和 runtime 信息，用户只能看到裸 `Failed to fetch`。

## 调研过程

- 读取当前 in-app browser 页面，确认 URL 是 `http://127.0.0.1:5173/?threadId=...`，页面没有 widget runtime data、没有 token、没有 `canvasightMcp` bridge。
- `curl http://127.0.0.1:5173/api/sessions/local/run` 在未 claim 时返回 `409 unbound_dev_session`。
- 手动 claim 后，Run 进入 daemon，但返回 `native_direct_disabled`，说明 daemon 进程本身禁用了 Codex native delivery。
- 检查 `vite.config.ts` 发现 `ensureDaemonServer()` 启动 daemon 时只注入 token，没有默认启用 `CANVASIGHT_CODEX_NATIVE`。
- 检查 `mcp/server.mjs` 发现 `/api/health` 不暴露 native delivery 状态，dev server 无法识别旧 daemon 配置错误。

## 可选方案

- 只改 toast 文案：能减少误导，但不能解决 Run 仍不发送。
- 只要求用户手动重启 daemon：不可接受，问题会在旧 daemon 复用时反复出现。
- dev server 默认启用 native delivery，并用 health 校验拒绝复用错误 daemon：能让 browser fallback 按当前 thread 发送，同时保留 `CANVASIGHT_CODEX_NATIVE=0` 的显式排队模式。

## 推荐方案

采用第三种。默认 dev/browser fallback 在有 thread claim 时启用 Codex app-server delivery；只有显式 `CANVASIGHT_CODEX_NATIVE=0` 时保留队列 fallback。

## 实施步骤

- `/api/health` 增加 `codexNativeEnabled`。
- `vite.config.ts` 增加 `expectedCodexNativeEnabled()`，健康检查发现 daemon native 开关不匹配时拒绝复用旧 daemon。
- dev server 启动 daemon 时默认设置 `CANVASIGHT_CODEX_NATIVE=1`。
- Run 前再次执行 `claimUrlThreadForProject(project.path)`，避免初始化 claim 漏掉。
- `requestJson()` 捕获 fetch reject，并将失败 URL、session、token presence、host 类型写入 `CanvasightApiError` payload。
- 更新 dev server smoke 测试：默认 claim 后应该尝试 `thread/resume` + `turn/start`；显式 native disabled 用例仍排队。
- bump 插件版本到 `0.1.38` 并刷新本地插件缓存。

## 风险与回滚

风险：browser fallback 通过 Codex app-server direct delivery 仍依赖 Codex Desktop 当前可用的 app-server 协议。如果 app-server 拒绝或没有确认，Canvasight 会按既有逻辑进入 `await_canvasight_run` 队列，而不是误报 sent。

回滚：还原 `vite.config.ts` 中默认 native enable 和 health 校验；或启动 dev server 时显式设置 `CANVASIGHT_CODEX_NATIVE=0`。

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run build`
- `npm run test:mcp`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list | rg 'canvasight@canvasight-local|canvasight-local'`
- 当前 dev server 已重启为 `0.1.38`，daemon health 返回 `codexNativeEnabled: true`。
