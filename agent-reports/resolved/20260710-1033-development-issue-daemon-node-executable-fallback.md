---
status: resolved
report_type: issue
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-10 10:31
updated_at: 2026-07-10 10:33
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
solution_report: agent-reports/resolved/20260710-1033-development-solution-daemon-node-executable-fallback.md
---

# 失效的 Node 绝对路径让 Canvasight daemon 启动超时

## TL;DR

长期存活的 Canvasight MCP shim 持有已被 Homebrew 删除的 `process.execPath`，直接启动 daemon 时触发 `ENOENT`，但旧实现未监听 child `error`，最终只报无上下文的启动超时。

## 发现者

Development Agent

## 提交 Agent

Development Agent

## 建议交接 Agent

Development Agent

## 问题描述

用户通过原生 `open_canvasight` 首次打开时 daemon 超时。生命周期日志记录了旧缓存 `0.1.48` MCP shim 尝试执行 `/opt/homebrew/Cellar/node/25.9.0_2/bin/node`，得到 `ENOENT`；child `error` 未被启动逻辑接住，等待 8 秒后才返回 `Canvasight daemon did not start in time`。同一任务的后续调用又因旧 MCP transport 已退出而返回 `Transport closed`。

## 现象

- `open_canvasight` 首次失败为 daemon start timeout。
- lifecycle 有 `spawn ... node ENOENT` 的 uncaught exception。
- 手动启动新 daemon 后，旧 task 的 MCP shim 不会热重建。

## 复现方式

1. 用不存在的 `CANVASIGHT_NODE_BIN` 启动 MCP shim。
2. 调用带显式 `threadId` 的 `open_canvasight`。
3. 验证 shim 记录失败候选，回退到 PATH 中可用的 `node` 并完成原生打开。

## 影响范围

- 新任务的 native widget 与 browser fallback 都依赖 daemon，均会被失效 Node 路径阻断。
- 用户只会看到超时，无法区分 Node 可执行路径故障、daemon 崩溃或网络状态。

## 证据

- 真实 lifecycle 在 `2026-07-10T02:26:57Z` 记录 `spawn /opt/homebrew/Cellar/node/25.9.0_2/bin/node ENOENT`。
- `ensureDaemonServer()` 原先直接执行 `spawn(process.execPath, ...)`，且未监听 spawn `error`。
- 新增独立 home smoke 以不存在的可执行路径验证失败候选与后续回退成功。

## 初步归因

Homebrew 升级可删除旧 Cellar binary；已在运行的 Node 进程仍保留旧 `process.execPath` 字符串。daemon 启动实现将该字符串视作唯一可执行路径，并把异步 spawn 错误漏成超时。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何让未来 MCP shim 不依赖可能失效的 `process.execPath`？已处理：多候选回退。
- 如何让用户和排障日志看到真实 spawn 失败？已处理：lifecycle attempt/failure/spawned/timeout 事件。

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

新任务在旧 Cellar 路径失效后，自动使用 PATH 中当前可用的 Node 启动 daemon；若所有候选都不可用，工具立即返回包含尝试项的明确错误。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已增加 Node executable fallback、异步 spawn 错误捕获和生命周期诊断，并同步版本到 `0.1.50`。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run test:mcp`
- `npm run typecheck`
- `npm run build`
- plugin validator

## 后续风险

已加载旧 `0.1.48` MCP transport 的当前 task 不能热切换到 `0.1.50`，仍需 reinstall 后 reload 或新任务；这不是 daemon 回退代码可以在该旧 transport 内修复的问题。
