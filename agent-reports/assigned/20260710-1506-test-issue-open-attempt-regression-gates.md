---
status: assigned
report_type: issue
owner: Test Supervisor Agent
created_by: main-thread
priority: high
created_at: 2026-07-10 15:06
updated_at: 2026-07-10 15:34
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/package.json
solution_report: agent-reports/resolved/20260710-1534-test-solution-open-attempt-regression-gates.md
agent_id: /root/test_supervisor_agent_v2
---

# OpenAttempt 与可见实例回归门禁

## 问题描述

现有 smoke 手动伪造 ready，没有覆盖重复/乱序 metadata、不同 renderer 实例、完整生产 bundle 与可见 canvas，因此持续产生假阳性。

## 期望结果

- 覆盖 metadata→ready→重复 metadata、双通道乱序、失败后的迟到事件与新 session。
- 覆盖 hidden/inline instance 不能满足 fullscreen ready，以及 attempt/session/thread/instance 错配拒绝。
- 增加完整 widget HTML + production bundle + fake MCP host 的组合测试，验证 overlay 消失与 canvas DOM 可见。
- 自动测试继续明确不能替代真实 Codex native-host 验收。

## 当前状态

assigned；自动门禁已完成并通过，详见 solution report。真实 Codex native-host 的 ready、可见画布、真实控件、同任务 Run、重复事件不回退五项验收尚未执行，因此本 issue 保持 assigned/unverified。

## 处理结果

已补齐自动回归与 production widget 组合门禁；自动测试不能替代真实宿主验收。

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/package.json`

## 验证方式

- `npm run build`
- `npm run test:mcp`
- `npm run test:widget-runtime`

## 后续风险

真实 Codex Desktop fullscreen widget 尚未完成最终验收，不能据此声明原生打开已修复。

## Closure Criteria

- [x] 状态事件重排覆盖
- [x] instance isolation 覆盖
- [x] production bundle 组合覆盖
- [x] 全套自动测试记录
- [ ] 真实 Codex native-host 最终验收
