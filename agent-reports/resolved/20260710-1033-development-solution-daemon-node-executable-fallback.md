---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-10 10:31
updated_at: 2026-07-10 10:33
related_issue: agent-reports/resolved/20260710-1033-development-issue-daemon-node-executable-fallback.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# 为 Canvasight daemon 增加 Node executable 回退与启动诊断

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260710-1033-development-issue-daemon-node-executable-fallback.md`

## Root Cause

daemon launcher 唯一依赖 `process.execPath`。当长期运行的 shim 来自已删除的 Homebrew Cellar binary 时，`spawn()` 异步发出 `ENOENT`；旧实现没有监听该事件，继续等待 daemon state，因此向用户伪装成通用 timeout。

## 调研过程

检查真实 `mcp-lifecycle.log`、当前安装 cache 和 `ensureDaemonServer()`。日志精确记录旧 `0.1.48` cache path 与已失效 Cellar binary，源码精确显示直接 `spawn(process.execPath, ...)`。以真实 widget resource 无关的独立 daemon home 进行失败路径 smoke，排除缓存、daemon HTTP 和 widget bridge 为第一失败点。

## 可选方案

- 方案 A：继续使用 `process.execPath`，仅改 timeout 文案。不能启动 daemon，不采用。
- 方案 B：只使用 PATH `node`。在受限 PATH 的运行时不稳健，不采用。
- 方案 C：使用可配置路径、PATH `node`、npm Node path、`process.execPath` 的去重候选，监听每次 spawn，并在错误时回退。采用。

## 推荐方案

`CANVASIGHT_NODE_BIN` 允许受管运行时显式指定 Node；默认优先通过 PATH 查找当前 `node`，再尝试 npm 记录路径和当前进程路径。每次 spawn 记录 lifecycle attempt；`ENOENT` 等失败即时记录并继续；全失败会立即报出尝试项。成功 spawn 但 health 未就绪时，timeout 保留实际 executable、daemon state 与 lifecycle 路径。

## 实施步骤

1. 增加去重的 daemon Node 候选解析和 failure 序列化。
2. 将 detached daemon spawn 包装成等待 `spawn`/`error` 的 Promise，并逐候选回退。
3. 为 attempt、failure、spawned、exhausted、start timeout 写入 lifecycle 日志。
4. 用独立 `CANVASIGHT_HOME` 和失效 `CANVASIGHT_NODE_BIN` 补 MCP smoke。
5. 同步 runtime 版本到 `0.1.50`。

## 风险与回滚

PATH 中的 `node` 必须仍可执行；若没有候选，错误现在会立即且明确地返回。可通过 `CANVASIGHT_NODE_BIN` 锁定受管 Node。回滚只需移除新候选 launcher，但会重新引入旧 Cellar 升级后无法启动的问题。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run test:mcp` 通过，覆盖 configured executable 的 `ENOENT` 后 fallback daemon spawn。
- `npm run typecheck` 通过。
- `npm run build` 通过；仅有既有 bundle-size warning。
- plugin validator 通过。
- `git diff --check` 通过。

## 后续风险

当前用户任务仍加载旧 cache `0.1.48` shim，出现 `Transport closed` 后不会热重建；安装 `0.1.50` 后必须 reload 或新开任务再验收原生 open。
