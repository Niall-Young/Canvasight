---
schema_version: 1
report_id: issue-widget-viewport-recovery-save-count
report_type: issue
status: assigned
owner: Test Supervisor Agent
created_by: Main Thread
priority: medium
version: 1
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-26T05:51:42Z
updated_at: 2026-07-26T05:51:42Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: failed
verification_evidence:
  - Repeated latest npm run test:widget-runtime runs fail at line 1472 because afterSaveCalls is 5 while beforeSaveCalls is 4.
  - Git blame traces the assertion to baseline commit 1026b43a and the current scoped diff does not modify App.tsx or widget-runtime-smoke.mjs.
  - Exact 0.4.36 native React 185 and rich-text acceptance pass, so this remains a separate automated viewport-contract risk.
solution_report:
---

# Widget viewport recovery 多一次 document save

## TL;DR

latest `npm run test:widget-runtime` 在同 binding hide/restore 场景多记录一次 `/document` save，违反“程序化 viewport recovery 不覆盖已保存 Page viewport”的 fixture 合同。

## 发现者

Main Thread

## 提交 Agent

Main Thread

## 建议交接 Agent

Test Supervisor Agent

## 问题描述

Widget runtime smoke 在 `plugins/canvasight/tests/widget-runtime-smoke.mjs:1472` 重复得到 `afterSaveCalls=5`、`beforeSaveCalls=4`。本轮 React presentation recovery 与富文本路径没有修改该断言或 `App.tsx`，真实原生验收也没有表现出对应用户故障。

## 复现方式

1. 进入 `plugins/canvasight`。
2. 运行 `npm run test:widget-runtime`。
3. 观察 `programmatic viewport recovery must not overwrite the saved Page viewport` 断言。

## 影响范围

程序化 viewport 恢复、Page viewport 保存次数与 Widget runtime 自动化可信度。

## 初步归因

尚未诊断。可能是恢复时序引发一次额外持久化，也可能是 fixture 对合法保存的计数边界过窄；在建立独立红色最小循环前不得修改断言。

## 期望结果

确认额外 `/document` save 的调用源与语义；若属于错误持久化则修复 runtime，若属于合法保存则以证据更新 fixture 合同。

## Closure Criteria

- [ ] 建立独立、稳定的 viewport save-count 红色循环
- [ ] 定位额外 save 的调用源
- [ ] runtime 或 fixture 修复通过
- [ ] 不回归用户 viewport、Refresh 与同 binding 恢复

## 当前状态

assigned / failed，作为独立已知风险跟踪，不阻断已通过的 React #185 与富文本原生验收。

## 后续风险

在解决前不得声称 latest `test:widget-runtime` 全绿。
