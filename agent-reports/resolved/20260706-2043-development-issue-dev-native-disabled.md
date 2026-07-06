---
status: resolved
report_type: issue
owner: development-agent
created_by: test-supervisor-agent
priority: critical
created_at: 2026-07-06 20:43
updated_at: 2026-07-06 20:43
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
  - plugins/canvasight/src/App.tsx
solution_report: agent-reports/resolved/20260706-2043-development-solution-dev-native-disabled.md
---

# Dev 页面 Run 原生发送被默认禁用

## TL;DR

真实 `npm run dev` / `127.0.0.1:5173` 页面没有设置 `CANVASIGHT_CODEX_NATIVE=1`，导致点击 Run 默认进入队列而不是发送到当前 Codex thread。

## 发现者

Test Supervisor Agent

## 提交 Agent

Test Supervisor Agent

## 建议交接 Agent

Development Agent

## 问题描述

用户在当前 Codex thread 里打开 Canvasight 浏览器页面后，点击有内容节点的 Run 按钮没有在当前 thread 生成 follow-up message。此前测试通过，是因为 smoke test 默认注入了 `CANVASIGHT_CODEX_NATIVE=1`，而真实 `npm run dev` 启动没有这个环境变量。

## 现象

- 用户点击 Run 后当前 Codex 输入区/对话没有新增消息。
- 服务端 direct-send 测试通过，但真实 dev 页面行为不一致。
- UI 只能显示 queued/fallback，不能满足用户“不要虚拟点击、直接发到当前 thread”的要求。

## 复现方式

1. 从 Codex thread 打开 `http://127.0.0.1:5173/` 或通过 `open_canvasight` 使用浏览器 fallback。
2. 当前项目/session 已有 thread claim。
3. 点击包含正文的节点 Run。
4. 观察当前 Codex thread 没有收到 follow-up message。

## 影响范围

- 浏览器 fallback / dev 页面 Run delivery。
- 当前 thread claim 后的跨 thread 运行体验。
- `npm run dev` 与 smoke test 的一致性。

## 证据

- `nativeCodexEnabled()` 将空环境变量解释为 disabled。
- `tests/dev-server-smoke.mjs` 的 `run()` helper 默认设置 `CANVASIGHT_CODEX_NATIVE: "1"`，掩盖真实启动路径。
- 用户连续多次在真实页面点击 Run 均未收到消息。

## 初步归因

默认开关语义错误：直发路径被做成显式 opt-in，但产品需求要求 claim 后默认尝试 native app-server `turn/start`。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 是否应让 native direct delivery 默认开启？
- 如何保留诊断/回滚开关？
- 如何让测试覆盖真实默认路径？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/src/App.tsx`
- `README.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`

## 期望结果

dev/browser 页面在当前 thread 已 claim 且 Codex app-server 可用时，点击 Run 默认通过 `turn/start` 发送；只有显式禁用或 app-server 失败时才进入 `await_canvasight_run` 队列。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。`CANVASIGHT_CODEX_NATIVE` 现在默认启用，只有显式 `0/false/off/no` 才禁用；测试改为覆盖真实默认路径。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `README.md`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:dev-server`
- `npm run test:mcp`
- browser/dev Run click verification

## 后续风险

如果 Codex Desktop app-server 在某个宿主版本不可用，Run 会继续进入队列并提示原因；这时需要用 `await_canvasight_run` 接收或更新宿主。
