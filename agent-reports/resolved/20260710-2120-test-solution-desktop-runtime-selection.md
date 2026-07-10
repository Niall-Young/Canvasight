---
status: resolved
report_type: solution
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
created_at: 2026-07-10 21:20
updated_at: 2026-07-10 21:20
related_issue: agent-reports/resolved/20260710-2108-test-issue-desktop-runtime-selection.md
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Desktop runtime 选择与握手失败 Smoke

## 负责 Agent

Test Supervisor Agent

## 对应问题

`agent-reports/resolved/20260710-2108-test-issue-desktop-runtime-selection.md`

## Root Cause

原 MCP smoke 仅通过 `CANVASIGHT_CODEX_BIN` 注入一个 fake executable，不能验证 macOS Desktop runtime 的选择顺序、PATH 降级边界，或失败的 Desktop handshake 是否错误地改用 PATH CLI。

## 推荐方案

用隔离的 fake runtime copies 和测试专用 Desktop 候选路径覆盖，在真实 MCP 子进程的 `open_canvasight` 当前-task 路径上记录 initialize executable；生产 resolver 保持固定目录优先级。

## 处理结果

- 覆盖显式 `CANVASIGHT_CODEX_BIN`、Codex.app、ChatGPT.app 和仅无 Desktop binary 时的 PATH `codex`。
- Desktop candidate initialize 失败时断言只启动该 candidate，绝不启动 PATH fake CLI。
- Plan/Goal smoke 断言返回 runtime path、source、version 和 transport 诊断。
- 既有 Plan/Goal 错误路径仍断言 native mode 未应用；Run 不会进入 bridge payload 发送。

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run test:mcp` 通过。
- `git diff --check` 通过。
- 实机确认 `/Applications/ChatGPT.app/Contents/Resources/codex` 存在且版本为 `codex-cli 0.144.0-alpha.4`；`/Applications/Codex.app` runtime 不存在。

## 后续风险

自动化仅验证 runtime 和 RPC 门控。必须重启 ChatGPT/Codex Desktop，创建全新 task 后通过真实 native widget 完成 Plan/Goal 设置与同 task Run 的最终验收。
