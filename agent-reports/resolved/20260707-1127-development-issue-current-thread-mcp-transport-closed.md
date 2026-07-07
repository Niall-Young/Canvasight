---
status: resolved
report_type: issue
owner: development-agent
created_by: main-thread
priority: critical
created_at: 2026-07-07 11:27
updated_at: 2026-07-07 21:19
solution_report: agent-reports/resolved/20260707-2119-skill-solution-transport-closed-contract.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/skills/canvasight-open/SKILL.md
  - plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md
---

# 当前 Codex thread 的 Canvasight MCP transport 已关闭

## 提交 Agent

main-thread

## 建议交接 Agent

development-agent

## 问题描述

用户在 Canvasight 页面点击 Run 后，toast 显示“当前是浏览器 fallback，Run 尚未发送到 Codex thread，已放入 Canvasight 队列。请在当前 Codex thread 调用 await_canvasight_run 接收。”

本轮排查确认：该 toast 的语义是正确的，当前页面确实是普通 browser fallback，不具备 native widget host bridge。新的阻断点是当前 Codex thread 的 Canvasight MCP transport 已经关闭，导致无法通过当前 thread 调用 `open_canvasight` 打开真正的 widget，也无法可靠调用 `await_canvasight_run` 接收 fallback 队列。

## 复现方式

1. 在当前 Codex thread 中，用户继续使用已打开的 `127.0.0.1:5173` Canvasight 页面。
2. 点击有内容节点的 Run 按钮。
3. 页面显示 browser fallback queued 文案。
4. 主线程尝试调用 `mcp__canvasight.open_canvasight`。
5. 工具返回 `Transport closed`。
6. 主线程继续尝试 `mcp__canvasight.open_canvasight_recent_project` 和 `mcp__canvasight.list_canvasight_recent_projects`，同样返回 `Transport closed`。

## 影响范围

- 当前 Codex thread 无法打开 Canvasight native widget。
- 当前 Codex thread 无法通过 Canvasight MCP tool 接收 queued Run payload。
- 用户在旧 browser fallback 页面点击 Run 只会排队，不会直发到当前 thread。
- 如果继续在这个 thread 里测试，会误判为 Run 投递代码仍然失效。

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`

## 证据

- `codex plugin list` 显示 `canvasight@canvasight-local installed, enabled 0.1.32`。
- `npm run dev:status` 显示 dev server 正在运行：`http://127.0.0.1:5173 pid=25490`。
- 手动 JSON-RPC 调用缓存 server `/Users/niallyoung/.codex/plugins/cache/canvasight-local/canvasight/0.1.32/mcp/server.mjs`：
  - `initialize` 返回 `{ name: "canvasight", version: "0.1.32" }`。
  - `tools/list` 包含 `render_canvasight_canvas_widget`、`open_canvasight`、`await_canvasight_run`。
  - `tools/call open_canvasight` 成功返回 widget result。
- 当前 live Codex thread 调用 `mcp__canvasight.open_canvasight` 返回：
  - `tool call failed for canvasight/open_canvasight`
  - `Caused by: Transport closed`
- 当前 live Codex thread 调用 `mcp__canvasight.open_canvasight_recent_project` 和 `list_canvasight_recent_projects` 同样 `Transport closed`。

## 初步归因

优先判断为当前 Codex thread 的 Canvasight MCP transport stale/dead，而不是 0.1.32 runtime 的 `open_canvasight` 代码必崩。

当前 browser fallback toast 不是新的 false sent bug，而是 0.1.32 修复后的正确降级提示。真正需要验证的是：重载当前 Codex session 或新开 thread 后，Canvasight MCP transport 是否恢复，`open_canvasight` 是否能返回并渲染 native widget。

## 期望结果

- 当前 thread 或新 thread 能调用 `open_canvasight`，并得到 native widget result。
- Canvasight widget 页面诊断应显示 widget iframe 候选状态，而不是 `parent === window` 的 browser fallback。
- 在 widget host bridge 可用时，点击 Run 应作为当前 Codex thread 的 follow-up message 发送。
- 在 browser fallback 页面中，toast 必须继续明确说明 queued，并由 `await_canvasight_run` 接收。

## 交付给哪个 Agent

development-agent

## 需要回答的问题

- Codex Desktop 中 live MCP transport `Transport closed` 是否可由插件端自恢复，还是只能 reload/new thread？
- 是否需要 Canvasight skill 在遇到 `Transport closed` 时主动提示 reload/new thread，而不是继续让用户点击旧 browser fallback 页面？
- 当前 `open_canvasight` widget result 在 fresh thread 中是否能真正渲染为 native widget，而非普通网页附件？
- 如果 fresh thread 仍然无法直发，是否是 Codex Desktop widget host bridge 的能力问题，需要继续 deep research？

## 当前状态

resolved

## 处理结果

已处理本报告中“是否需要 Canvasight skill 在遇到 `Transport closed` 时主动提示 reload/new thread”的部分。`canvasight-open`、`canvasight-run`、`canvasight-troubleshooting` 现在明确把可见工具返回 `Transport closed` 分类为 `canvasight_mcp_transport_closed`，要求停止当前线程的正常 open / Run recovery 流程并 reload/new thread，不能把 browser fallback 当作 native Run 修复路径。

真实 live MCP transport 是否能由 Codex Desktop 当前线程恢复不由插件运行时代码控制，本轮不伪装为已修复；恢复路径仍是 reload 或新线程后重新调用 `open_canvasight`。

## 修改文件

- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`
- `AGENTS.md`

## 验证方式

- `skill-creator` quick validation for changed Canvasight skills
- `npm run test:mcp`
- `codex plugin list`
- `npm run dev:status`

## 后续风险

- 如果当前 thread 不 reload，继续调用当前线程里的 Canvasight MCP tools 仍可能返回 `Transport closed`。
- 如果 fresh thread 中 `open_canvasight` 成功但仍无 widget host bridge，需要继续调查 Codex Desktop widget 渲染能力；不能回退到 browser fallback 作为成功路径。
