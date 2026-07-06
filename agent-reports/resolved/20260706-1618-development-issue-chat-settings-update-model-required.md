---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: high
created_at: 2026-07-06 16:18
updated_at: 2026-07-06 16:26
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
solution_report: agent-reports/resolved/20260706-1626-development-solution-chat-settings-update-model-required.md
---

# Chat Run 被 settings update 的 model schema 拦截

## TL;DR

Canvasight Chat 模式点击运行仍未发送到 Codex，因为真实 Codex app-server 要求 `thread/settings/update` 同时提供 `model`。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

在修复 `missing field settings` 后，用户再次点击节点运行按钮，页面仍只显示/打开 Markdown，当前 Codex 线程没有收到消息。

## 现象

- Canvasight 节点点击运行后，左侧 Codex 输入线程没有新增用户消息。
- 真实 Codex app-server 对手动复现的 `thread/settings/update` 返回 `Invalid request: missing field model`。

## 复现方式

1. 在 Codex app 内打开 `http://127.0.0.1:5173/`。
2. 在 Canvasight 节点上点击运行按钮。
3. 检查当前 Codex 线程是否收到 Canvasight Markdown。
4. 使用真实 app-server 发送 `thread/settings/update`，观察 schema 错误。

## 影响范围

Chat 模式的直接发送链路、claimed 当前线程发送链路、dev server 本地页面发送链路。

## 证据

- 用户截图显示运行按钮点击后左侧线程未收到消息。
- 真实 app-server 返回：`Invalid request: missing field model`。
- 当前实现对 Chat 模式也先调用 `thread/settings/update`。

## 初步归因

Chat 模式本质不需要修改线程 collaboration mode。把 Chat 当作 `default` settings update 会触发真实 app-server 的完整 settings schema，从而阻止后续 `turn/start`。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- Chat 模式是否应该完全跳过 `thread/settings/update`？
- Goal 设置后是否还需要立即 reset default settings？
- Smoke test 如何覆盖真实点击路径不再发 settings update？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`

## 期望结果

Chat 模式点击运行直接调用当前 Codex 线程的 `turn/start`，不再被 settings schema 拦截。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。Chat 模式不再调用 `thread/settings/update`，因此不会触发真实 app-server 的 `model` schema；Goal 路径也移除了 default settings reset。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260706-1618-development-issue-chat-settings-update-model-required.md`
- `agent-reports/resolved/20260706-1626-development-solution-chat-settings-update-model-required.md`
- `agent-reports/resolved/20260706-1626-integration-summary-chat-settings-update-model-required.md`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`
- `codex plugin list | grep 'canvasight@canvasight-local'`
- `npm run dev:status`
- 浏览器刷新到 `http://127.0.0.1:5173/` 并确认 Canvasight 页面可用

## 后续风险

Plan 模式仍依赖 `thread/settings/update`，需要后续用真实 plan 点击路径继续确认 app-server 是否也要求完整 `model` settings。
