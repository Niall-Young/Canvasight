---
schema_version: 1
report_id: issue-native-widget-task-switch-remount-blank-0-4-32
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 6
agent_id: /root/development_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T09:45:36Z
updated_at: 2026-07-18T11:33:53Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Exact 0.4.32 started a fresh fullscreen widget instance after the Codex task switch, completed session and project hydration, but the visible native panel remained blank.
  - The same widget instance reached verified ready at 788 by 794 only after the user collapsed and reopened the Codex sidebar 17 seconds later.
  - 0.4.33 bounded fullscreen re-presentation implementation and focused fake-host regressions pass the complete local candidate matrix.
  - Commit aca7efce7fb595a22b09a060a34ec37f1ae15490 is installed as exact 0.4.33; tracked cache parity is 582 of 582 with zero missing or mismatched files.
  - Exact 0.4.33 native A to B to A still produced a white panel; bounded fullscreen re-presentation did not restore it, and the same instance became ready only after the Codex sidebar was collapsed and reopened.
  - 0.4.34 local candidate adds one host-capability-gated F,F,F,I,F pulse with bounded diagnostics; enhanced widget smoke and the complete local release matrix pass without rehydration, save, size-change or false-ready.
  - Exact 0.4.34 restarted-host strict ready passed for session-mrq9yr8f-af49cd63, open-mrq9yr8g-84217f715f73 and widget-4d1e7efe-10cd-4f2e-9941-d11bd34158e6 at fullscreen 788 by 794 with all render evidence true.
  - Three real A to B to A rounds passed without collapsing the sidebar, white screen, inline flicker or Connecting regression; Page round-trip, 50 percent zoom Refresh, same-task native Run and post-Run stability also passed.
solution_report: agent-reports/resolved/solution-native-widget-task-switch-remount-mode-pulse-0-4-34.md
---

# 0.4.32 切回任务后原生 Widget 白屏

## TL;DR

真实 Codex Desktop 从其他任务切回后，Canvasight fresh Widget 已完成 bridge、session 和 project hydration，但宿主没有恢复可见画布；只有手工折叠并重新打开侧边栏才恢复，阻断 0.4.32 发布。

## 问题描述

Canvasight 在 bridge connect 时只请求一次 fullscreen。task return fresh WebView 如果宿主未完成 presentation/layout，`waitForRenderableCanvas` 只会被动等待 visibility、host context、ResizeObserver 与尺寸命中，不会主动重申 fullscreen presentation。

## 复现方式

1. 在 exact 0.4.32 的已验证 fullscreen Canvasight 中完成正常控件和 Run 验收。
2. 切换到另一个 Codex 任务，再切回当前任务。
3. 观察右侧 Canvasight 面板保持纯白；折叠并重新打开侧边栏后画布才出现。

## 影响范围

原生 Widget task 往返、fresh instance 首次可见性、发布验收；不涉及 daemon、项目数据、Refresh 或 Run 合同。

## 证据

- `widget-ea380e8b-52e7-4625-8d7d-9fc9d86e934b` 于 `2026-07-18T09:40:34.687Z` 进入 `connecting_session`，`09:40:34.721Z` 进入 `hydrating_project`。
- session/project proxy 在 `09:40:34.921Z` 前完成，期间无 API/error。
- 侧边栏折叠/重开后，同一实例于 `09:40:51.649Z` 才以 788×794 报告 verified ready。

## 初步归因

故障层是 Codex native host presentation/layout。Canvasight 缺少 hydration 后不可渲染时的有界 fullscreen re-presentation 请求。

## 交付给哪个 Agent

Development Agent 实现最小修复；Test Supervisor Agent 独立定义并验证 task-surface suspend/resume 与 remount 回归。

## 期望结果

切回任务后无需折叠侧边栏，同一或 fresh Widget 能在有界时间内自动恢复可见、非零画布；不重复 session/open、保存或 hydration，也不降低 strict ready 门禁。

## Closure Criteria

- [x] 问题层与原生生命周期证据明确
- [x] 有界 fullscreen re-presentation 方案报告已回写
- [x] fresh zero-size host 回归覆盖初次请求不布局、后续请求恢复
- [x] 永久零尺寸宿主不会 false-ready，重试次数有界
- [x] exact 新版本完成三轮真实 A→B→A，无需侧边栏手工恢复
- [x] 修改文件、验证方式与后续风险已记录

## 当前状态

resolved。exact 0.4.34 已通过完整 native release gate，任务切回不再需要手工折叠侧栏。

## 处理结果

0.4.33 的两次同模式 fullscreen re-presentation 在真实宿主无效。0.4.34 的能力门禁单次 F,F,F,I,F 模式脉冲在真实 Codex Desktop 连续三轮任务往返中生效，并保留严格 ready/Run/Refresh 合同。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- 0.4.34 版本字段、MCP bundle 与 web dist

## 验证方式

- 0.4.34 聚焦 widget runtime、完整本地矩阵与 exact native-host acceptance 全部通过。

## 后续风险

受控模式脉冲依赖宿主声明 inline/fullscreen 能力；不支持时继续保持严格失败而不 false-ready。诊断仍保留 available modes、请求/结果模式、host context、viewport/rect/hit-test 以支持后续宿主变化。
