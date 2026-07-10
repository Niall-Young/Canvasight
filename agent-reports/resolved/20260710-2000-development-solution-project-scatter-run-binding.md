---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-10 20:00
updated_at: 2026-07-10 20:00
related_issue: agent-reports/assigned/20260710-1920-test-issue-project-scatter-run-binding.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# 项目 `.scatter` 与 Codex 任务绑定隔离

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/20260710-1920-test-issue-project-scatter-run-binding.md`

## Root Cause

当 `thread/resume` 无法读取当前 Codex task 时，`resolveSessionProjectPath` 会静默回退到 Canvasight 的默认目录。native widget 因而可能打开默认目录的 `.scatter/scatter.json`，造成不同项目看起来共用同一个画布。另一个风险是 `.scatter` 规范化保留未知顶层字段，可能将历史线程字段继续写回项目文件。

## 推荐方案

保留显式 `projectPath` 最高优先级；native/current-thread 操作无法解析 task 项目目录时返回 `current_thread_project_unavailable`，不再回退到默认项目。session hydration 保留已打开 session 的项目目录，仅刷新当前 task claim。规范化 `.scatter` 时剥离 `codexThreadId`、`threadId`、`threadClaimedAt`，使任务绑定仅驻留 daemon session。

## 实施步骤

1. 为项目解析增加受控的 `requireThreadProject` 选项。
2. 在 native open、claim、graph write 和 Run await 的无显式路径操作中启用该保护。
3. 在 hydration 中保留现有 session 项目目录，禁止二次 thread-resume 覆盖。
4. 添加 thread/resume 失败时的 native-open 与 hydration 回归覆盖。
5. 将 runtime 版本同步升级为 `0.3.2+codex.20260710200000`。

## 风险与回滚

不能恢复 Codex 自身损坏的 rollout；Plan/Goal 仍应阻断，避免模式未应用却发送消息。回滚只需恢复此前的路径回退逻辑和版本；不建议这样做，因为会重新引入跨项目 `.scatter` 污染风险。

## 处理结果

已修复。项目内容继续只读写 `<project>/.scatter/scatter.json`，Run 目标仍临时绑定 native widget 的当前 Codex task。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run typecheck` 通过。
- `npm run test:mcp` 通过，包括损坏 task 不回退默认项目和 hydration 保留项目目录。
- `npm run build` 通过。

## 后续风险

需要在重载 Codex Desktop 后使用新 task 做一次真实 native-host acceptance；自动 smoke 不能替代该验证。
