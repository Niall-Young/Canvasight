---
status: resolved
report_type: solution
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: high
created_at: 2026-07-10 15:34
updated_at: 2026-07-10 15:34
related_issue: agent-reports/assigned/20260710-1506-test-issue-open-attempt-regression-gates.md
related_files:
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/package.json
---

# OpenAttempt 回归与 production widget 组合门禁

## 负责 Agent

Test Supervisor Agent (`/root/test_supervisor_agent_v2`)

## 对应问题

`agent-reports/assigned/20260710-1506-test-issue-open-attempt-regression-gates.md`

## Root Cause

旧 smoke 只验证 session 级手工 ready，没有覆盖 renderer identity、事件乱序和真实 production App，因此 hidden/inline 假阳性与 Ready 回退无法被阻止。

## 调研过程

先将现有 MCP harness 迁移到 `openAttemptId`、`widgetInstanceId`、startup stage 和 display mode，再用完整 widget resource 驱动 fake MCP Apps host。组合测试曾真实发现两处生产回归：terminal failed 被迟到 ready 覆盖，以及 diagnostics bridge-state 形成 React 最大更新深度循环；生产修复后门禁转绿。

## 可选方案

- 方案 A：继续使用字符串/VM smoke，速度快但不能证明 production bundle 的 React commit 与 canvas DOM。
- 方案 B：读取 MCP 生成的完整 widget HTML，在 headless Chrome 中接入 fake fullscreen MCP host。

## 推荐方案

采用方案 B，并保留轻量 VM/MCP 回归；两者分别覆盖事件顺序/identity 和真实组合生命周期。

## 实施步骤

1. 覆盖 metadata → ready → 重复 metadata、双通道乱序、failed 后迟到 ready、跨 session 迟到事件。
2. 覆盖 inline 不能满足 fullscreen、错误 attempt/thread 拒绝、ready evidence 完整性。
3. 新增 `test:widget-runtime`，从 `resources/read` 加载完整 inline production bundle，通过 fake MCP Apps fullscreen host 完成 session、project hydration 和 ready lifecycle。
4. 断言 startup overlay 消失、静态 fallback 清空、canvas DOM 有尺寸且命中可交互、ready identity/evidence 完整。

## 风险与回滚

组合测试依赖 macOS Google Chrome 路径；不满足环境时会明确失败。删除新增脚本和 package 命令即可回滚，不影响生产数据。

## 处理结果

自动回归与组合门禁已完成并通过；原生宿主最终验收仍未完成。

## 修改文件

- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/package.json`

## 验证方式

- `npm run build`：通过。
- `npm run test:mcp`：通过，输出 `MCP smoke test passed`。
- `npm run test:widget-runtime`：通过，输出 `Canvasight composed production widget smoke passed.`。

## 后续风险

这些自动测试只提供 supporting evidence。必须安装精确版本、重启 Codex Desktop，并在新任务完成真实 fullscreen ready、可见画布、真实控件、同任务 Run 和重复事件不回退验收后，才能关闭 assigned issue 或声明已修复。
