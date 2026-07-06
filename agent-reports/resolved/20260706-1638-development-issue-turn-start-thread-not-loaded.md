---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 16:38
updated_at: 2026-07-06 16:45
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
solution_report: agent-reports/resolved/20260706-1645-development-solution-turn-start-thread-not-loaded.md
---

# Canvasight Run 对 notLoaded Codex thread 直接 turn/start 失败

## TL;DR

用户点击 Canvasight Run 后，payload 已进入 daemon，但 direct delivery 的 `turn/start` 返回 `thread not found`，因为目标 thread 在 app-server 中是 `notLoaded`。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

Canvasight 0.1.22 已经让 Chat 跳过 `thread/settings/update`，但用户实际点击运行后仍没有消息进入当前 Codex thread。通过 daemon fallback 读取到这次点击的真实 payload，确认失败点已经变成 `turn/start`。

## 现象

- 浏览器点击节点 Run 后，左侧 Codex 输入区没有收到 Canvasight Markdown。
- daemon 中的 Run payload 显示 `codexNative.status: applied`。
- `codexTurn.status: failed`，错误为 `thread not found: 019f2af1-d6ed-7793-b0e3-047d83bcbfb1`。
- app-server `thread/list` 可以列出该 thread，但状态是 `notLoaded`。

## 复现方式

1. 打开 `http://127.0.0.1:5173/`。
2. 点击包含正文的 Canvasight 节点 Run。
3. 调用 daemon `/api/runs/await` 获取 fallback payload。
4. 观察 `codexTurn.error`。
5. 调用 app-server `thread/list`，观察目标 thread 状态为 `notLoaded`。

## 影响范围

Canvasight direct delivery 到当前 Codex thread 的 Chat、Plan 和 Goal 后续发送链路。

## 证据

- fallback payload：`codexTurn.error = "thread not found: 019f2af1-d6ed-7793-b0e3-047d83bcbfb1"`。
- app-server `thread/list`：同一 id 存在，但 `status.type = "notLoaded"`。
- 当前实现每个 app-server method 都启动独立 `codex app-server --stdio` 进程，无法在 `thread/resume` 后复用加载态。

## 初步归因

`turn/start` 只能对已加载或已 resume 的 thread 工作。Canvasight 当前没有在同一个 app-server 连接里先 `thread/resume`，因此对 `notLoaded` thread 直接 `turn/start` 会失败。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何让 `turn/start` 前在同一个 app-server stdio 连接里执行 `thread/resume`？
- Plan/Goal native 操作是否也需要先 resume？
- Smoke test 如何模拟真实 app-server 对未 resume thread 的拒绝？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`

## 期望结果

Canvasight Run 在 direct delivery 时先加载目标 thread，再调用 `turn/start`，点击后消息进入当前 Codex thread。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。Canvasight native delivery 现在会在同一个 `codex app-server --stdio` 连接里先 `thread/resume`，再执行 `turn/start`、`thread/settings/update` 或 `thread/goal/set`。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`

## 验证方式

- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run typecheck`

## 后续风险

真实点击产生的旧 fallback payload 在诊断时已被读取消费；用户需要刷新后重新点击节点 Run 才会触发新修复路径。
