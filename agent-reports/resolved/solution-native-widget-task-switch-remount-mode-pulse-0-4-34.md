---
schema_version: 1
report_id: solution-native-widget-task-switch-remount-mode-pulse-0-4-34
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T11:11:42Z
updated_at: 2026-07-18T11:11:42Z
depends_on:
  - issue-native-widget-task-switch-remount-blank-0-4-32
  - solution-native-widget-task-switch-remount-presentation-retry-0-4-33
related_issue: agent-reports/assigned/issue-native-widget-task-switch-remount-blank-0-4-32.md
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Controlled recovery is gated by host support for both inline and fullscreen and runs at most once per binding.
  - The fixed request ceiling is fullscreen, fullscreen, fullscreen, inline, fullscreen.
  - Final fullscreen waits for inline request acknowledgement and a newer matching host-context event.
  - Enhanced production-widget smoke covers success, permanent zero-size, delayed inline and teardown during the inline leg.
  - Complete 0.4.34 local release matrix and plugin validation pass.
---

# 0.4.34 任务切回受控模式脉冲

## Root Cause

0.4.33 证明重复请求相同 fullscreen 模式不能驱动 Codex 右侧宿主容器重新布局。Canvasight 的 bridge、session 和 hydration 已完成，但宿主 presentation surface 仍保持零尺寸/白屏，折叠并重新展开侧栏才会触发有效重排。

## 推荐方案

保留严格可见性门禁。在初始 fullscreen 与两次有界 fullscreen retry 仍不可渲染时，仅当 host context 明确声明同时支持 inline/fullscreen，针对当前 binding 执行一次 inline→fullscreen pulse。inline request 必须得到 inline ACK 与更新后的 inline host context，才允许最终 fullscreen。

## 实施结果

- 每个 binding 固定上限 `F,F,F,I,F`，不循环、不 teardown、不 reload。
- 每个 await 后校验 binding/teardown；inline 阶段绝不 ready。
- 最终仍要求 fullscreen、正尺寸、可见样式和 hit-test 命中应用。
- 记录有界 presentation diagnostics：能力、请求/结果模式、host context、viewport、rect、visibility 和 hit-test。
- 成功后的迟到 inline context 不得把最终 identity 降级。

## 风险与回滚

真实 Codex host 是否把模式脉冲映射为侧栏重排仍未知。失败时删除 pulse 路径并保留 0.4.33 的严格门禁与诊断；不得把手工折叠侧栏作为发布验收。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- 0.4.34 同步版本字段、生成 MCP bundle 与 web dist

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run check:mcp-bundle`
- `npm run test:widget-runtime`
- 完整 0.4.34 local release matrix 与 plugin validator

## 后续风险

只有重启 Codex Desktop 后 exact 0.4.34 的真实 A→B→A 才能确认宿主是否接受该 actuator。本报告只证明本地实现合同，不关闭 native issue。
