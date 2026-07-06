---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: critical
created_at: 2026-07-06 21:41
updated_at: 2026-07-06 21:41
related_issue: agent-reports/resolved/20260706-2128-development-issue-run-false-sent-drops-payload.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
---

# 解决方案：Run false-sent 改为可领取队列

## 负责 Agent

Development Agent，主线程集成；Product、Test Supervisor、Skill Expert、Customer Support、Project Management Agent 已回执。

## 对应问题

`agent-reports/resolved/20260706-2128-development-issue-run-false-sent-drops-payload.md`

## Root Cause

Canvasight 把 isolated app-server `turn/start` accepted 当成了产品层 `sent`。`enqueueRun()` 看到 `delivery.status === "sent"` 后不入队，导致当前 Codex UI 没消息时用户也无法用 `await_canvasight_run` 找回 payload。

## 调研过程

- 用户截图证明 toast 显示“已发送到已绑定 Codex thread”，但当前 Codex thread 没有新增消息。
- 代码检查确认 `dispatchRunToCodexThread()` 在 `startCodexTurn()` resolve 后返回 `status: "sent"`。
- Agent Team 回执一致：`sent` 只能由 native widget host bridge 或可见当前 thread 证明；browser/dev fallback 不能用 app-server accepted 冒充成功。

## 可选方案

- 继续修 `turn/start`：风险是仍然无法证明 live Codex Desktop UI 可见收到消息。
- 改为 queue-first：浏览器/dev fallback 不再误报，payload 不丢，当前 thread 可用 `await_canvasight_run` 明确领取。

## 推荐方案

采用 queue-first。默认关闭 native direct；显式诊断打开 native direct 时，`turn/start` accepted 也只保留为 `codexTurn` 诊断信息，delivery 仍为 queued。

## 实施步骤

1. `nativeCodexEnabled()` 默认返回 false，仅显式 `1/true/on/yes` 开启诊断。
2. `dispatchRunToCodexThread()` 的 `turn/start` 成功分支返回 `queued + turn_start_unverified`。
3. 前端 fallback 收到 `sent` 或 `turn_start_unverified` 时也显示 queued 文案，不再显示“已发送到已绑定 Codex thread”。
4. 更新 tests、README、AGENTS、design 和 Canvasight skills。
5. bump Canvasight 到 `0.1.30` 并重装插件缓存。

## 风险与回滚

风险：旧浏览器/dev 页面不再承诺点击即自动出现在 Codex thread；这是对真实能力的纠偏。回滚会重新引入 false sent 和 payload 丢失。

## 处理结果

已修复。

## 修改文件

- `AGENTS.md`
- `README.md`
- `design.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-open/SKILL.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`

## 验证方式

- `node --check plugins/canvasight/mcp/server.mjs`
- `git diff --check`
- `npm run typecheck`
- `npm run test:dev-server`
- `npm run test:mcp`
- `npm run build`
- plugin validation
- in-app browser visible verification

## 后续风险

自动把 Markdown 插入当前 Codex UI 仍只能依赖 native widget host bridge；browser/dev fallback 只能提供 claim + queue + await 的可靠路径。
