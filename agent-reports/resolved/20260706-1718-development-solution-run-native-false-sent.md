---
status: resolved
report_type: solution
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-06 17:18
updated_at: 2026-07-06 17:18
related_issue: agent-reports/resolved/20260706-1718-development-issue-run-native-false-sent.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
  - README.md
---

# 修复 Canvasight Run native false sent

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1718-development-issue-run-native-false-sent.md`

## Root Cause

Canvasight daemon 使用 `codex app-server --stdio` 启动了隔离 app-server。该进程可以对同一个 thread 文件执行协议调用并返回 `turn/start` 成功，但它不是 Codex Desktop 当前 UI 的 live app-server，因此不会把消息显示到当前线程。原实现把这个协议成功当成真实发送成功，导致 false-positive `sent`。

## 调研过程

- 复现真实点击后 UI 没收到但 daemon 回执为 `sent`。
- 用独立 app-server 读取同一 thread，确认只能看到磁盘 idle history，看不到当前 Desktop live in-progress turn。
- 检查 `codex app-server proxy`，确认它需要 live control socket。
- 检查 `~/.codex/app-server-control/`，确认默认 control socket 不存在。
- 排除前端按钮点击和 Markdown 构建问题，定位为 runtime 通道问题。

## 可选方案

- 方案 A：继续默认 direct-send，并增加更多 timeout/重试。风险是仍可能 false-positive。
- 方案 B：回到虚拟点击/剪贴板。违反项目约束，且不稳定。
- 方案 C：默认禁用 native direct delivery，仅在显式 `CANVASIGHT_CODEX_NATIVE=1` 时保留开发测试路径；默认进入 `await_canvasight_run` 队列。

## 推荐方案

采用方案 C。它不再向用户报告假的 `sent`，并保留 payload 不丢失。等 Codex Desktop 暴露可靠 live app-server 控制通道后，再把 direct delivery 作为可验证路径恢复。

## 实施步骤

1. 将 `nativeCodexEnabled()` 改为显式 opt-in。
2. native disabled 时返回 `reason: native_direct_requires_explicit_opt_in`。
3. UI 将该 reason 显示为“已排队，等待当前 Codex thread 接收”。
4. 现有 direct-send smoke tests 显式设置 `CANVASIGHT_CODEX_NATIVE=1`。
5. dev-server smoke 新增默认 native disabled 的 queued + await 验证。
6. 更新 Run/Troubleshooting skills 和 README，避免继续承诺默认 direct delivery。
7. 版本提升到 `0.1.25` 并重建 `dist/`。

## 风险与回滚

风险是点击 Run 不再自动出现在 Codex 输入区，必须由当前 thread 调用 `await_canvasight_run`。回滚方式是设置 `CANVASIGHT_CODEX_NATIVE=1` 重新启用实验 direct path，但该路径不应作为默认用户体验，除非能连接 live Desktop app-server。

## 处理结果

已修复。

## 修改文件

- `README.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `plugins/canvasight/skills/canvasight-open/references/open-workflow.md`
- `plugins/canvasight/skills/canvasight-troubleshooting/references/troubleshooting.md`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/index-C1io2Z9r.js`

## 验证方式

- `npm run typecheck`
- `npm run test:dev-server`
- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`

## 后续风险

Plan/Goal 原生模式仍依赖可靠 live app-server。当前版本会诚实返回 disabled/queued，不再静默降级或伪装发送成功。
