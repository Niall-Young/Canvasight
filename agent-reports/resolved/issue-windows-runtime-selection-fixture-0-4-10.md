---
schema_version: 1
report_id: issue-windows-runtime-selection-fixture-0-4-10
report_type: issue
status: resolved
owner: Test Supervisor Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-13T07:25:23Z
updated_at: 2026-07-13T07:30:50Z
depends_on:
  - issue-cross-platform-ci-regressions-0-4-10
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
  - .github/workflows/canvasight-plugin.yml
verification_status: passed
verification_evidence:
  - Exact Node 20.19 full MCP smoke passes with the cross-platform fake runtime.
  - Bundle and clean no-node_modules distribution still expose exactly 14 tools.
  - Development review confirms production selection and no-fallback semantics are unchanged.
solution_report: solution-windows-runtime-selection-fixture-0-4-10
---

# Windows runtime selection 测试夹具失败

## TL;DR

The Windows matrix now reaches the full MCP smoke but the runtime-selection fixture cannot execute its Unix-style copied `.mjs` candidate as a Windows app-server binary.

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Test Supervisor Agent, with Development Agent review.

## 问题描述

The runtime-selection smoke copies an executable shebang script into candidate paths and prepends PATH with `:`. Those assumptions are Unix-specific and prevent the fake explicit runtime from returning the configured thread cwd on Windows.

## 现象

`runtime-explicit request 2` returns `current_thread_project_unavailable` on Windows while all distribution and registration gates already pass.

## 复现方式

1. Run commit `bdf14b49bee0bbba9b5acc77bbf74ad82031f7b0` in the Windows Node 20.19 workflow.
2. Observe `npm run test:mcp` fail inside `assertDesktopRuntimeSelection` before the main smoke sequence.

## 影响范围

Windows automated full-runtime acceptance only; the clean no-`node_modules` install and 14-tool discovery gates pass.

## 证据

- Run `29231927431`, Windows job `86757872500`.
- `explicitBin` is a copied `.mjs` file and PATH uses a hard-coded colon in the fixture.

## 初步归因

Cross-platform test fixture defect rather than a shipped MCP registration or dependency defect.

## 交付给哪个 Agent

Test Supervisor Agent.

## 需要回答的问题

- Can the fixture use a real platform executable while still proving explicit/Desktop/PATH selection order and failed-Desktop no-fallback behavior?

## 相关文件

- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

The same runtime-selection assertions execute on Windows, macOS and Linux without weakening production runtime behavior.

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

The fixture now uses real `node.exe` candidates plus the fake script on Windows, while preserving all runtime-selection assertions.

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`

## 验证方式

- Exact Node 20.19 syntax/full MCP smoke, bundle consistency and clean 14-tool distribution checks.

## 后续风险

The next hosted matrix must confirm Windows. Real native Windows Desktop acceptance remains separate.
