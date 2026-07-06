---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-06 16:45
updated_at: 2026-07-06 16:45
related_issue: agent-reports/resolved/20260706-1638-development-issue-turn-start-thread-not-loaded.md
---

# 解决 Canvasight Run 对未加载 Codex 线程发送失败

## 负责 Agent

Development Agent

## Root Cause

Canvasight 每次调用 Codex app-server method 都会启动独立的 `codex app-server --stdio` 进程。真实 Codex thread 在该进程中可能只是 `notLoaded` 状态，对它直接调用 `turn/start` 会返回 `thread not found`。

## 调研过程

1. 读取 daemon fallback payload，确认浏览器点击已经进入 Canvasight 队列。
2. payload 中 `codexNative.status` 为 `applied`，但 `codexTurn.status` 为 `failed`。
3. 错误为 `thread not found: 019f2af1-d6ed-7793-b0e3-047d83bcbfb1`。
4. app-server `thread/list` 可以列出同一 thread id，但状态为 `notLoaded`。
5. 生成并检查当前 app-server schema，确认 `turn/start` 的 `input`、`cwd`、`effort` 字段符合协议。

## 可选方案

- 方案 A：每次 Run 前单独调用一次 `thread/resume`，再新开进程调用 `turn/start`。缺点是加载态不一定跨进程保留。
- 方案 B：在同一个 app-server stdio 连接内按顺序执行 `thread/resume` 和目标 method。优点是符合真实 app-server 的加载语义。
- 方案 C：放弃 direct delivery，只依赖 `await_canvasight_run` fallback。缺点是不能满足用户点击后直接发送到当前 thread 的要求。

## 推荐方案

采用方案 B。新增 app-server sequential request helper，让 `thread/resume` 与后续 `turn/start`、`thread/settings/update`、`thread/goal/set` 在同一个 `codex app-server --stdio` 连接中完成。

## 实施步骤

1. 在 `server.mjs` 中新增 `appServerRequestSequence()`，复用同一 app-server 子进程执行多个 JSON-RPC request。
2. `startCodexTurn()` 改为 `thread/resume -> turn/start`。
3. `setCodexCollaborationMode()` 改为 `thread/resume -> thread/settings/update`，并从 resume 结果中读取当前 model 写入 `collaborationMode.settings.model`。
4. `setCodexGoal()` 改为 `thread/resume -> thread/goal/set`。
5. fake app-server 测试改为未 resume 的 `turn/start`、`thread/settings/update`、`thread/goal/set` 直接失败。
6. bump Canvasight 到 `0.1.23`，避免旧插件缓存继续运行旧 MCP server。

## 风险与回滚

风险：如果未来 app-server `thread/resume` 返回结构变化，Plan 设置中的 model 读取会失败。回滚方式是恢复 0.1.22 的单请求调用，但会重新暴露 notLoaded thread 的发送失败。

## 验证方式

- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run typecheck`

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 后续风险

旧点击 payload 已被诊断消费，用户需要重新触发 Run 才会走新逻辑。
