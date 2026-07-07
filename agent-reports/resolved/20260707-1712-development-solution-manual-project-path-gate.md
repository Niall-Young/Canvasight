---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-07 17:12
updated_at: 2026-07-07 17:12
related_issue: agent-reports/resolved/20260707-1642-product-issue-manual-project-path-gate.md
---

# 自动解析当前项目路径并移除手动输入页

## 负责 Agent

Development Agent

## Root Cause

Canvasight 的 dev fallback 和 MCP session 创建在缺少显式 `projectPath` 时无法直接从插件进程 `cwd` 推断用户项目，因为 `.mcp.json` 将 MCP server `cwd` 固定在插件目录。上一轮为了避免误开 Canvasight 仓库，前端在 thread-only fallback 下停止使用默认路径，但留下了手动项目路径输入页，导致用户必须自己输入路径。

## 调研过程

- 检查 `App.tsx` 初始化流程，确认 thread-only URL 会跳过 session 默认路径，但缺少自动解析后的恢复路径。
- 检查 `mcp/server.mjs`，确认 Codex app-server `thread/resume` 能返回当前 thread 的 `cwd`。
- 检查 `vite.config.ts` dev API，确认 local session 可以通过 daemon 创建真实 session。
- Development Agent 和 Test Supervisor Agent 均确认：不得再展示手动路径 gate，也不得默默 fallback 到 Canvasight repo。

## 可选方案

- 要求所有 fallback URL 都带 `projectPath`：稳定但违背用户“在哪个项目打开就自动创建”的要求。
- 保留手动输入作为兜底：实现简单，但用户明确要求移除。
- 通过当前 `threadId` 调用 app-server `thread/resume` 获取 `cwd`：符合产品要求，且可以在 dev smoke 中用 fake Codex app-server 验证。
- 裸 `5173` 无 thread 上下文时停止打开 Vite 默认项目：不能自动推断当前项目，但至少不会误开 Canvasight 仓库。

## 推荐方案

使用 `thread/resume` 解析当前 Codex thread 的项目 `cwd`。打开 Canvasight、thread-only dev fallback、AI 写图、claim 和 await 在缺少显式 `projectPath` 时优先走当前 thread 项目；如果没有可用 thread 上下文，则只显示恢复错误，不展示手动路径输入页。

## 实施步骤

- 在 MCP server 增加 `codexThreadProjectPath` 和 `resolveSessionProjectPath`，用 `thread/resume` 获取当前项目路径。
- `createSession`、`claimThreadForProject`、`write_canvasight_graph`、`await_canvasight_run` 默认项目解析改为优先 thread cwd。
- dev fallback 增加 `/resolve-thread-project` API，前端 thread-only URL 自动调用该 API。
- 删除前端手动项目路径输入表单和对应 CSS。
- 裸 local dev URL 没有 `threadId` 或 `projectPath` 时不再使用 Vite 注入的默认项目路径。
- 修复 dev fallback 在切换项目后复用旧 daemon session 的问题。
- 同步 README、AGENTS、Canvasight open/troubleshooting skill 文档，并将插件版本提升到 `0.1.37`。

## 风险与回滚

- 风险：旧 Codex thread 可能仍使用旧插件缓存，需要 reload 或新开 thread。
- 风险：没有任何 threadId 的裸 dev URL 没有可靠项目上下文，只能作为开发入口。
- 回滚：恢复 `0.1.36` 版本文件和 dev fallback 行为，但会重新出现手动路径 gate 或默认仓库漂移问题。

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run build`
- `npm run test:mcp`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `npm run dev:status`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`
- `curl -X POST /api/sessions/local/resolve-thread-project` 使用当前 `CODEX_THREAD_ID` 返回当前工作区路径。
- Codex 内置浏览器打开 `?threadId=<current-thread-id>` 后显示 `Page 1` 和节点，不显示手动路径输入页。
