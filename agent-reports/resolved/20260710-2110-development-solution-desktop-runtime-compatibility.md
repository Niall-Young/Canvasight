---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-10 21:10
updated_at: 2026-07-10 21:10
related_issue: agent-reports/assigned/20260710-2108-test-issue-desktop-runtime-selection.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
---

# Desktop runtime 选择与 Plan/Goal 兼容性

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/20260710-2108-test-issue-desktop-runtime-selection.md`

## Root Cause

运行时仅优先检查 Codex.app，找不到时直接执行 PATH 的 `codex`，可能选中无法读取 ChatGPT Desktop 当前 task archive 的旧 CLI。

## 推荐方案

每次 app-server 操作只解析一次 runtime：显式 `CANVASIGHT_CODEX_BIN`、Codex.app、ChatGPT.app、最后 PATH。Desktop runtime 已选中后，初始化或请求失败不重新解析或回退 PATH。

## 处理结果

- 增加 ChatGPT.app runtime 候选，并提供仅供隔离 smoke 使用的 `CANVASIGHT_CODEX_APP_BIN` 与 `CANVASIGHT_CHATGPT_APP_BIN` 候选覆盖。
- 原生 Plan/Goal 成功结果记录 transport、runtimeBin、runtimeSource、runtimeVersion 与 runtimeIsDesktop。
- 失败保留 rawError，并分类为 `desktop_runtime_unavailable`、`thread_archive_incompatible` 或通用 native 请求失败；严格 Plan/Goal sendMessage 门保持不变。
- 已在现有 MCP smoke 中验证显式 runtime 的诊断字段。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`

## 验证方式

- `npm run test:mcp` 通过。

## 后续风险

Test Supervisor 正在补充候选顺序和 Desktop 握手失败不回退 PATH 的隔离 smoke。真实 native-host Plan/Goal 点击验收仍不可由自动测试替代。
