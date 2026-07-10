---
status: resolved
report_type: solution
owner: Customer Support Agent
created_by: Customer Support Agent
priority: medium
created_at: 2026-07-10 21:08
updated_at: 2026-07-10 21:08
related_issue: runtime compatibility implementation requested by main thread
related_files:
  - README.md
---

# Desktop runtime compatibility documentation

## 负责 Agent

Customer Support Agent

## 对应问题

Desktop Plan / Goal Run can select an obsolete PATH `codex` runtime that cannot read the current Desktop task archive.

## Root Cause

The prior FAQ described the safe Run block for unreadable task metadata, but did not explain runtime selection or distinguish an unavailable Desktop runtime from an incompatible thread archive.

## 调研过程

Checked `AGENTS.md`, `design.md`, the Canvasight package manifest, MCP server behavior, and every Canvasight skill. The README already documented strict Plan/Goal blocking and no UI automation; only the runtime-resolution and recovery guidance was missing.

## 可选方案

- Keep the existing generic unreadable-thread FAQ.
- Add a bilingual, user-facing explanation of runtime preference and the two recovery paths.

## 推荐方案

Add the narrow bilingual FAQ clarification without exposing development commands as normal workflow.

## 实施步骤

1. State the runtime preference order in the malformed-rollout FAQ.
2. Explain Desktop-runtime-unavailable versus thread-archive-incompatible recovery.
3. Reaffirm that Plan/Goal does not send content before native mode confirmation.

## 风险与回滚

The FAQ is aligned with the delivered `desktop_runtime_unavailable` and `thread_archive_incompatible` classifications. Revert only this clarification if the runtime policy changes.

## 处理结果

已补充双语 FAQ，保留既有的严格发送门控与无 UI 自动化边界。

## 修改文件

- `README.md`

## 验证方式

- Confirmed both Chinese and English malformed-rollout FAQ entries now describe the selection order, separate recovery paths, and blocked-send contract.
- No user workflow commands were added.

## 后续风险

Real native-host Plan/Goal acceptance remains required. Final integration must verify the selected runtime and recovery message in a real Desktop task.
