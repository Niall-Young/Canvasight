---
status: resolved
report_type: issue
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
created_at: 2026-07-10 21:08
updated_at: 2026-07-10 21:20
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
solution_report: agent-reports/resolved/20260710-2120-test-solution-desktop-runtime-selection.md
---

# Desktop runtime 选择与 Plan/Goal 降级回归缺口

## TL;DR

当前 smoke 固定 `CANVASIGHT_CODEX_BIN` 为 fake CLI，未覆盖 Codex.app / ChatGPT.app / PATH 的优先级，也不能证明 Desktop runtime 握手失败时不会改用旧 PATH CLI。

## 处理结果

已由 `agent-reports/resolved/20260710-2120-test-solution-desktop-runtime-selection.md` 覆盖候选优先级、PATH 边界、Desktop handshake 无回退与 Plan/Goal runtime diagnostics。

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- `npm run test:mcp` 通过。
- `git diff --check` 通过。

## 后续风险

真实 native-host 验收仍需重启 Desktop 后由主线程执行。
