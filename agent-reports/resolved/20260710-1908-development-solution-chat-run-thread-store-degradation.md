---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-10 19:08
updated_at: 2026-07-10 19:08
related_issue: agent-reports/assigned/20260710-1905-development-issue-persistent-thread-store-run-block.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Chat Run 的 thread-store 预检降级

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/20260710-1905-development-issue-persistent-thread-store-run-block.md`

## Root Cause

持续的 Codex `thread/resume` thread-store/session metadata 错误会耗尽有限重试。即使 fullscreen native widget 已绑定同一 task，统一的模式预检门槛仍阻止 host `sendMessage` 被调用。

## 调研过程

检查用户给出的 rollout 路径后确认文件首条是有效 `session_meta`，与 app-server 错误不一致。现有重试已处理瞬态竞争，但没有持续失败的 Chat 合同。Chat 不需要写入 thread mode；Plan/Goal 分别需要 settings/goal app-server 写操作。

## 可选方案

- 继续阻断所有模式：无法恢复用户的 Chat Run。
- 对所有模式跳过预检：会伪造 Plan/Goal 状态，未采用。
- 只让 Chat 的精确 thread-store 读取错误降级到已验收 host bridge：采用。

## 推荐方案

当且仅当 Chat 在有限 `thread/resume` 重试后仍返回可识别的 thread-store/rollout metadata 错误时，daemon 返回 `preflight_degraded_chat` 和原始错误诊断。前端只接受这一个 Chat 状态并继续调用 host `sendMessage`；Promise reject 仍失败，Promise resolve 才回报 sent。Plan/Goal 不接受该状态。

## 实施步骤

1. 为 Chat 的精确 thread-store 读取失败返回显式降级状态，不标记为 applied。
2. 扩展前端 Run 状态类型，并仅放行 Chat 的该精确状态。
3. 增加永久四次 resume 失败测试，断言 Chat prepared、无 settings update，且 Plan 仍拒绝。
4. 同步运行时版本至 `0.3.1+codex.20260710190600` 并重建 widget。

## 风险与回滚

Chat 的 target 仍依赖已验证 fullscreen widget host bridge；若 bridge Promise 拒绝，不会显示 sent。Codex thread-store 的根因不在插件内。恢复为对所有模式阻断可回滚此改动，但会重现该用户无法发送的问题。

## 处理结果

已修复。诊断中会保留 `preflight_degraded_chat`、`thread_store_preflight_unavailable` 与原 app-server 错误，而不会把模式预检误报为 applied。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `.codex-plugin/plugin.json`、`package.json`、`package-lock.json`、built widget asset

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/canvasight`
- `git diff --check`

## 后续风险

仍需要在重启后的 Codex Desktop 新 task 用真实受影响 rollout 验证 Chat bridge Promise 成功；Plan/Goal 必须在 app-server thread-store 恢复后再运行。
