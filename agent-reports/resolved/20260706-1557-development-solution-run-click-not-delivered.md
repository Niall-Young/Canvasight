---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-06 15:57
updated_at: 2026-07-06 15:57
related_issue: agent-reports/resolved/20260706-1549-product-issue-run-click-not-delivered.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
---

# 修复真实点击 Run 未触发 Codex turn

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1549-product-issue-run-click-not-delivered.md`

## Root Cause

真实 UI 点击已经调用 `/api/sessions/local/run` 并进入 daemon queue。失败不是按钮绑定，也不是 claim 丢失，而是 native Codex app-server 参数不合法：

`thread/settings/update` 收到的 `collaborationMode.settings` 中包含 `model: null`、`reasoning_effort: null`、`developer_instructions: null`。真实 app-server 对这些字段做类型校验，返回 `Invalid request: invalid type: null, expected a string`。随后 `codexNative.status` 变成 `failed`，`dispatchRunToCodexThread()` 跳过 `turn/start`，Run 只保留在 fallback queue。

Goal 路径也存在同类风险：`thread/goal/set` 会传 `tokenBudget: null`。

## 调研过程

- 从当前 in-app browser 确认页面 URL 是裸 `http://127.0.0.1:5173/`，真实 UI 中存在可点击的 Run 按钮。
- 查询 daemon project claim，确认当前项目已有 thread claim，且 dev server/daemon 进程环境有 `CODEX_THREAD_ID`。
- 通过 `/api/runs/await` 读取用户刚才真实点击留下的 fallback payload，发现 `codexNative.status=failed`，错误为 `Invalid request: invalid type: null, expected a string`。
- Development Agent 确认 root cause 是 `codexCollaborationMode()` 传了 null 可选字段。
- Test Supervisor Agent 要求 future test 不能继续宽松接受 null。
- Customer Support / Skill Agent 确认文档语义无需变化，这是既有承诺的 bug fix。

## 可选方案

- 方案 A：继续依赖 `await_canvasight_run` fallback。不能解决真实点击不发送的问题，拒绝。
- 方案 B：禁用 native mode，直接 `turn/start`。会破坏 Plan/Goal 的模式切换语义，拒绝。
- 方案 C：所有 Codex app-server 请求省略无值可选字段，并让测试桩拒绝 null。采用。

## 推荐方案

采用方案 C。Codex app-server 请求只传有值字段：

- default/chat mode：`{ mode: "default" }`
- plan mode：`{ mode: "plan", settings: { reasoning_effort: "medium" } }`
- goal：不传 `tokenBudget`，除非将来真的有预算值
- turn/start：只在有值时传 `cwd` 和 `effort`

## 实施步骤

1. 修改 `codexCollaborationMode()`，移除所有 null settings 字段。
2. 修改 `setCodexGoal()`，未设置预算时不发送 `tokenBudget`。
3. 修改 `startCodexTurn()`，只在有值时发送 `cwd` 和 `effort`。
4. 将 fake Codex app-server 改为递归拒绝 `null` 参数。
5. bump 插件版本到 `0.1.20`。

## 风险与回滚

- 风险：真实 app-server 未来如果需要显式空值，当前省略字段可能需要重新适配；但当前错误证明 null 不被接受。
- 风险：尚未添加独立浏览器级 smoke，UI 点击链路仍依赖本轮真实失败 payload 和严格 API smoke 共同覆盖。
- 回滚：恢复旧 payload 构造并降回 `0.1.19`，但会恢复真实点击不发送的 bug。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260706-1549-product-issue-run-click-not-delivered.md`
- `agent-reports/resolved/20260706-1557-integration-summary-run-click-not-delivered.md`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:dev-server`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`

## 后续风险

- 后续建议补浏览器级 smoke：真实打开页面、点击 Run、监听 `/api/sessions/:id/run` 响应和 fake app-server `turn/start`。
