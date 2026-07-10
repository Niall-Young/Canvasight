---
status: resolved
report_type: issue
owner: Development Agent
created_by: Test Supervisor Agent
priority: critical
created_at: 2026-07-10 19:05
updated_at: 2026-07-10 19:08
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
solution_report: agent-reports/resolved/20260710-1908-development-solution-chat-run-thread-store-degradation.md
---

# 持久 thread-store 读取错误阻断 Native Widget Run

## TL;DR

原生 widget 已获得当前 task 的宿主 bridge，但 `widget_bridge_prepare` 强制先执行 app-server `thread/resume`；损坏/非标准 rollout 文件会让四次 retry 全部失败，因此永远到不了 `sendMessage`。

## 发现者

用户现场反馈；Test Supervisor Agent 复核。

## 提交 Agent

Test Supervisor Agent

## 建议交接 Agent

Development Agent

## 问题描述

用户在已成功打开 Canvasight 的当前 task 点击 Run，收到 `Canvasight Run blocked before sendMessage: failed to read thread: thread-store internal error ... rollout ... does not start with session metadata`。该错误不是瞬态读取竞争，而是该 rollout 文件的持久解析失败。

## 现象

- `thread/resume` 返回 thread-store internal error。
- `retryThreadResumeSequence` 仅重试四次后重新抛出。
- `applyWidgetCodexMode` 将任何非 `applied` 结果转换为 502，前端因此不调用 widget host 的 `sendMessage`。

## 复现方式

1. 让 fake Codex 对当前 thread 的每一次 `thread/resume` 返回 `failed to read thread ... rollout does not start with session metadata`。
2. 对 verified widget session 请求 `deliveryMode: widget_bridge_prepare` 的 Chat Run。
3. 当前实现返回 `codex_mode_not_applied`，bridge 不会被调用。

## 影响范围

所有使用 native widget Run 且当前 Codex task rollout 无法被 thread-store 解析的用户；已打开的同一 widget 也无法发送 Markdown。

## 证据

- `plugins/canvasight/mcp/server.mjs:3353-3368` 将该错误识别为 retryable，但只作有限次数 retry。
- `plugins/canvasight/mcp/server.mjs:3500-3507` 把最终失败作为 sendMessage 的硬阻断。
- `plugins/canvasight/tests/mcp-smoke.mjs:2723-2760` 仅覆盖两次瞬态失败后的成功和一般 resume 失败；未覆盖永久 session-metadata 错误的预期降级合同。

## 初步归因

把“模式预检必须成功”当作“native host 已绑定当前 task 的 sendMessage 也必须禁止”的前提。对于 thread-store 无法读取的持久错误，这会把可用的 widget host bridge 与不可用的模式设置路径绑定在一起。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- Chat 模式在 thread-store 永久失败时，是否允许保留 `mode_preflight_skipped_thread_store_error` 诊断并继续 host `sendMessage`？
- Plan/Goal 无法确认模式设置时，是否应继续发送但明确标记模式未应用，或仅阻断这两种模式？
- 如何保证前端不会把“preflight skipped”误报为“mode applied”？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`

## 期望结果

持久 session-metadata/thread-store 错误有明确、经过测试的降级路径：只要 verified native widget bridge 后续 Promise 成功，Chat Run 至少可发送到同一 task；模式未能应用必须保留可见诊断而不能伪造已应用。

## Closure Criteria

- [x] 区分 transient retry 与 persistent thread-store parse failure
- [x] 定义 Chat / Plan / Goal 的安全降级语义
- [x] 增加永久 session-metadata 失败的回归测试
- [x] 通过 MCP、typecheck、build 验证
- [x] 记录真实 native-host 验收边界

## 当前状态

resolved

## 处理结果

Chat 的精确 thread-store 读取失败在重试耗尽后返回 `preflight_degraded_chat`，允许已验收 native widget 的 host bridge 尝试发送；Plan/Goal 和其他失败继续阻断。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- Canvasight version manifests and built widget asset

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- plugin validator
- `git diff --check`

## 后续风险

只有 `sendMessage` Promise 成功才是 sent；本轮没有真实 Codex host 对 thread-store 持续错误的点击验收。Plan/Goal 仍需 thread-store/app-server 可用。
