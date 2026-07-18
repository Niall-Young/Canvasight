---
schema_version: 1
report_id: issue-release-matrix-invalidates-native-session
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/development_agent
thread_id: 019f730b-0404-75f0-a460-3a080f0addd6
created_at: 2026-07-18T02:34:01Z
updated_at: 2026-07-18T02:46:35Z
depends_on:
  - issue-publish-stable-release-0-4-29
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
solution_report: agent-reports/resolved/solution-release-matrix-native-session-isolation.md
verification_status: passed
verification_evidence:
  - npm run test:mcp passed with CLI-home isolation regression coverage
  - npm run test:widget-runtime passed after cleanup isolation fix
  - npm run release:prepare -- 0.4.30 and release:verify passed
  - npm run check:mcp-bundle and git diff --check passed
---

# 发布矩阵使原生验收 Session 失效

## TL;DR

0.4.29 原生 widget 已完成 instance-bound ready 后，主线程并行运行本地 MCP 发布测试；测试期间默认 `~/.canvasight` daemon 被替换，已打开 widget 的 session 丢失，用户点击刷新与 Run 均得到 `stage=session / Session not found`。

## 问题描述

发布验收顺序把真实原生 session 与可能影响 daemon 生命周期的本地矩阵并行执行。即使自动化测试使用临时 `CANVASIGHT_HOME`，生命周期日志仍在 `2026-07-18T02:29:48.792Z` 记录默认安装 shim 以 `reason=before_spawn` 停止原 daemon PID 90995，并启动新 daemon；旧 session 不在新进程内。

## 现象

- 用户截图显示 `Canvasight couldn't start`。
- `Failed stage: session`。
- `Reason: Session not found`。
- “刷新到最新版本”与节点 Run 均无法验收。

## 复现方式

1. 用 exact 0.4.29 installed plugin 打开原生 widget 并获得 verified fullscreen ready。
2. 保持 widget 打开，同时运行本地发布矩阵，包含 `npm run test:mcp`。
3. 用户再操作 widget，观察默认 daemon 被重新拉起且旧 session 丢失。

## 影响范围

v0.4.29 发布验收、真实原生 session 持久性、MCP smoke 隔离边界与发布操作顺序。

## 证据

- Ready：`open-mrpqxx8b-d8a4b9437262` / `session-mrpqxx8b-da55613e` / `widget-79dc100d-e719-4fb6-9d54-afa2c9ecde86`，02:27:22Z ready。
- 失效：02:29:48Z `daemon_stop_orphans` 停止 PID 90995，随后新 daemon 替换状态文件。
- 用户截图：原生 widget 报 `Session not found`。

## 根因

`test:widget-runtime` 的 finally stopper 只传了 `--canvasight-home=<temporary-home>`；runtime 的 `canvasightHome()` 却只读环境变量，导致 stopper 实际操作默认 `~/.canvasight`。它停止 PID 90995 并删除 default state；installed shim 的下一次 widget API 请求随后把 90995 识别为 orphan 并启动新 daemon，旧 Session 因进程内状态丢失而不可恢复。

## 交付给哪个 Agent

Development Agent；Test Supervisor Agent 复核修复与重新验收顺序。

## 需要回答的问题

- 哪个测试或生命周期分支使默认安装 daemon 被识别为 orphan？
- 是否需要代码隔离修复，还是只需发布流程强制“矩阵先完成、原生验收最后执行”？
- 新 session 能否在不重启 Codex Desktop 的前提下安全重新创建并完成同任务 Run？

## 期望结果

自动化矩阵不能破坏正在验收的默认原生 session；真实宿主验收必须在所有会影响 daemon 的命令之后执行，且刷新、Run 与后续可见性均通过。

## Closure Criteria

- [x] 根因明确并有可复现证据
- [x] 必要的隔离修复和流程修正完成
- [x] 自动化隔离回归、MCP smoke 与 widget runtime smoke 通过
- [x] 有缺陷的 0.4.29 候选已被 runtime 版本 0.4.30 取代
- [x] exact 0.4.30 原生控件与同任务 Run 验收明确保留在发布 issue，未在本 issue 冒充通过

## 当前状态

resolved；自动化隔离缺陷已修复并升级为 0.4.30。发布仍需 exact 0.4.30 原生宿主验收。

## 处理结果

已修复。runtime 解析 `--canvasight-home`，优先级为 CLI > env > 默认 home；widget runtime cleanup 同时显式传 env；MCP smoke 覆盖 control/target 双 daemon 隔离。原 0.4.29 ready 证据继续作废，不能用于 0.4.30 发布。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `agent-reports/resolved/solution-release-matrix-native-session-isolation.md`
- 本报告。

## 验证方式

- lifecycle 日志时序与最小隔离复现。
- `npm run test:mcp`
- `npm run test:widget-runtime`
- `npm run release:prepare -- 0.4.30`
- `npm run release:verify -- 0.4.30`
- `npm run check:mcp-bundle`

## 后续风险

- exact 0.4.30 尚未完成真实 Codex 原生宿主验收；该门禁仍由发布 issue 管理。
- 原生验收必须排在全部生命周期测试之后，且验收后不得再运行可能启动或停止 daemon 的矩阵。
- 全量 Agent Team validator 仍被历史 legacy 报告格式问题阻断，本 issue 的新报告字段已按 schema 编写。
