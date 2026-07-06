---
status: resolved
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 16:56
updated_at: 2026-07-06 17:18
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
solution_report: agent-reports/resolved/20260706-1718-development-solution-run-native-false-sent.md
---

# Canvasight Run native delivery timeout and unclear queued status

## TL;DR

用户点击节点 Run 后 payload 已进入 daemon，但 direct delivery 失败为 `Codex app-server request timed out after 5000ms`。当前 UI/回执仍容易让用户感知成“点了没用”，且 smoke test 没覆盖真实 app-server 慢启动/恢复场景。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent, Test Supervisor Agent, Product Agent

## 问题描述

Canvasight 0.1.23 已经在 `turn/start` 前执行 `thread/resume`，但真实点击仍没有进入当前 Codex thread。通过 daemon `/api/runs/await` 取到本次点击的 fallback payload，确认：

- `codexNative.status = applied`
- `codexTurn.status = failed`
- `codexTurn.error = Codex app-server request timed out after 5000ms`
- `delivery.status = queued`
- `delivery.reason = turn_start_failed`

随后使用 Codex app 内置二进制 `/Applications/Codex.app/Contents/Resources/codex` 单独测试 `thread/resume`，initialize + resume 约 3.5 秒才完成。当前 5 秒默认 timeout 对 `thread/resume -> turn/start` 的真实链路过短。

## 现象

- 用户点击节点右上角 Run。
- 左侧当前 Codex thread 没有出现 Canvasight Markdown。
- Canvasight 页面只表现为打开 Markdown/预览，用户无法判断 direct delivery 已失败。
- fallback payload 存在，但当前 MCP tool transport 在本线程报 `Transport closed`，用户无法自然领取。

## 复现方式

1. 打开 `http://127.0.0.1:5173/`。
2. 确认当前项目 claim 到 thread `019f2af1-d6ed-7793-b0e3-047d83bcbfb1`。
3. 点击包含正文的节点 Run。
4. 用 daemon token 调 `/api/runs/await`。
5. 观察 `codexTurn.error` 为 `Codex app-server request timed out after 5000ms`。

## 影响范围

- Chat Run direct delivery。
- Plan Run 在 native settings 后继续发送 turn 的路径。
- Goal Run 如果 app-server 恢复/设置链路超过 5 秒，也可能失败。
- 用户对 Run 成功/排队/失败状态的判断。

## 证据

- daemon payload 中 `codexTurn.error = Codex app-server request timed out after 5000ms`。
- `/Applications/Codex.app/Contents/Resources/codex --version = codex-cli 0.142.5`。
- App 内置 app-server 单独 `thread/resume` 成功，但耗时约 3522ms。
- PATH 上旧 `/Users/niallyoung/.local/bin/codex` 为 `codex-cli 0.139.0`，手动测试会对同一 thread 报 thread-store internal error；Canvasight 源码默认使用 App 内置二进制，不是 PATH 旧二进制。

## 初步归因

`nativeCodexTimeoutMs()` 默认 5000ms，且该 timeout 覆盖 app-server initialize、插件启动、thread resume、turn start 的整段 sequence。真实 Codex Desktop app-server 冷启动和 thread resume 已接近 3.5 秒，继续执行 `turn/start` 很容易超过 5 秒。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 默认 native timeout 应提高到多少，并如何保持可配置？
- timeout error 是否应包含当前 app-server method，方便区分 `thread/resume` 和 `turn/start`？
- UI 是否需要展示 direct delivery failed/queued reason？
- smoke tests 如何模拟慢 app-server 和真实失败状态？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`

## 期望结果

点击 Run 后，真实 app-server 有足够时间把 payload 发送到当前 Codex thread；如果仍失败，payload 不丢失且 UI 明确显示 direct delivery 失败原因。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。0.1.24 先把 app-server timeout 从 5 秒扩大到 30 秒并补充 method 级错误诊断；随后 0.1.25 继续修正更深层根因：隔离 app-server 的 `sent` 不能代表当前 Codex Desktop thread 收到消息，默认 native direct delivery 改为显式 opt-in，Run 默认进入 `await_canvasight_run` 队列。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`

## 后续风险

当前版本不再默认 direct-send 到 Codex Desktop。用户点击 Run 后需要当前 Codex thread 使用 `await_canvasight_run` 领取队列 payload；Plan/Goal 原生模式只有在未来存在可靠 live app-server 控制通道或显式开发 opt-in 时才能自动应用。
