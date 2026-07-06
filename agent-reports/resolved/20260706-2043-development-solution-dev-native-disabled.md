---
status: resolved
report_type: solution
owner: development-agent
created_by: development-agent
priority: critical
created_at: 2026-07-06 20:43
updated_at: 2026-07-06 20:43
related_issue: agent-reports/resolved/20260706-2043-development-issue-dev-native-disabled.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# 解决方案：默认启用 daemon native Run delivery

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-2043-development-issue-dev-native-disabled.md`

## Root Cause

`nativeCodexEnabled()` 把空的 `CANVASIGHT_CODEX_NATIVE` 当成 false，真实 `npm run dev` 没有设置该变量，所以浏览器/dev Run 只进入队列。测试 helper 又默认把该变量设成 `"1"`，导致回归测试没有覆盖真实默认启动路径。

## 调研过程

- 检查 `plugins/canvasight/vite.config.ts`，确认 dev 页面会把 `/api/sessions/local/run` 转发给 daemon。
- 检查 `plugins/canvasight/mcp/server.mjs`，确认 daemon 的 `dispatchRunToCodexThread()` 会在 `nativeCodexEnabled()` 为 true 时调用 `thread/resume` 和 `turn/start`。
- 检查 `tests/dev-server-smoke.mjs`，确认测试默认注入 `CANVASIGHT_CODEX_NATIVE=1`。
- 对照用户真实页面行为，确认测试环境与真实启动环境不一致。

## 可选方案

- 方案 A：继续要求用户或 dev server 设置 `CANVASIGHT_CODEX_NATIVE=1`。缺点是用户体验仍然脆弱，且和“点击 Run 直接发当前 thread”不一致。
- 方案 B：默认启用 native direct delivery，仅保留显式禁用环境变量作为诊断回滚。缺点是 app-server 不可用时需要可靠 fallback。
- 方案 C：放弃浏览器/dev 直发，只支持 widget host bridge。缺点是用户明确要求当前浏览器页面也能工作。

## 推荐方案

采用方案 B。Canvasight 的核心体验是 Run 进入当前 Codex thread；浏览器/dev 页面已经有 project/session claim 机制，应默认尝试 daemon native `turn/start`，失败才排队。

## 实施步骤

1. 将 `nativeCodexEnabled()` 改为默认 true，只有 `0/false/off/no` 显式禁用。
2. disabled reason 改为 `native_direct_disabled`。
3. 前端 Run 状态优先识别 `sent`，只有 queued/failed 时显示排队提示。
4. dev-server smoke 去掉默认注入 `CANVASIGHT_CODEX_NATIVE=1`，让默认路径覆盖真实启动行为。
5. MCP smoke 默认传空环境变量，保留显式 `0` 的队列回归。
6. 更新 README 和 skills，明确 claim 后先直发、失败才 await。

## 风险与回滚

风险是某些 Codex app-server 版本不支持相关方法，会返回 failure 并进入队列。回滚方式是显式设置 `CANVASIGHT_CODEX_NATIVE=0`，让 Run 只进入 `await_canvasight_run` fallback。

## 处理结果

已修复。

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
- browser/dev Run click verification against `http://127.0.0.1:5173/`

## 后续风险

当前已打开的旧 dev server 需要重启后才会加载新的 Vite/server code。当前已打开的旧 Codex thread 也可能仍使用旧 plugin cache，需要 reinstall/reload 后验证。
