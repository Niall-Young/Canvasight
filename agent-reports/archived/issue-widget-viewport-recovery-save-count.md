---
schema_version: 1
report_id: issue-widget-viewport-recovery-save-count
report_type: issue
status: archived
owner: Test Supervisor Agent
created_by: Main Thread
priority: medium
version: 2
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-07-26T05:51:42Z
updated_at: 2026-07-26T06:32:59Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: not_applicable
verification_evidence:
  - The original 5-versus-4 save-count observation could not be reproduced in three sequential isolated reruns on the same 0.4.36 runtime and fixture bytes.
  - No App.tsx or widget-runtime fixture correction was required.
  - The observation is archived as non-reproducible test interference; its exact cause is unconfirmed.
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

## Disposition Criteria

- [x] 同一 0.4.36 候选连续三次顺序隔离运行通过
- [x] 未修改 runtime 或 fixture
- [ ] 建立独立稳定红色循环（未达到：当前无法复现）
- [ ] 定位额外 save 调用源（未达到：没有稳定反馈环）

## 当前状态

archived / not applicable。当前同一候选连续三次顺序运行均通过，未建立独立稳定红色循环，也未确认 runtime 或 fixture 缺陷。该记录不再构成 0.4.36 发布阻断。

## 后续风险

若再次出现，必须携带隔离运行日志、并发进程或端口信息及精确 before/after 请求序列重新建立 issue；本归档不代表曾观察到的 `5 !== 4` 已被诊断或修复。
