---
schema_version: 1
report_id: issue-cmd-zoom-boundary-flash
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T03:04:25Z
updated_at: 2026-07-13T03:40:43Z
depends_on:
  - issue-native-widget-thread-return-blank-canvas
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - design.md
verification_status: passed
verification_evidence:
  - automated implementation gates passed
  - exact delivery version 0.4.9+codex.20260713111214 is installed and enabled
  - user completed real Codex Desktop native-host acceptance and confirmed Cmd zoom behavior is correct
solution_report: agent-reports/resolved/solution-cmd-zoom-boundary-flash.md
---

# Cmd 缩放到边界时画布闪回默认大小

## TL;DR

排队中的 viewport recovery 可能在用户缩放期间使用旧 viewport，导致画布到达 200% 后瞬间闪回 100% 或 fitView。

## 现象与复现

1. 在 Canvasight 画布按住 Cmd 连续放大。
2. 缩放到 200% 上限后继续输入。
3. 画布偶发闪屏并短暂恢复默认大小。

## 影响范围

- Native widget 和浏览器开发面的画布缩放。
- 与 Thread 返回后的 viewport recovery 工作共享 `App.tsx` 恢复路径。

## 证据与初步归因

- `restoreCanvasViewport` 等待两帧后使用闭包捕获的 Page viewport。
- 用户交互期间 `onMove` 只更新显示百分比，最终 viewport 到 `onMoveEnd` 才持久化。
- 恢复任务可能在此窗口调用旧 `setViewport` 或 `fitView`，覆盖正在进行的缩放。

## 期望结果

- 用户 viewport 交互使已排队的旧恢复任务失效。
- 恢复执行时读取最新 store viewport。
- 20%/200% 边界后的同方向输入为稳定 no-op，反方向输入仍正常。

## Closure Criteria

- [x] 过期 recovery 不覆盖用户缩放
- [x] 非交互恢复、无效 viewport fitView 行为保留
- [x] 自动化覆盖上下限与最终 viewport 持久化
- [x] typecheck、build、widget smoke 和插件验证结果已记录
- [x] 真实 native-host 已验证，或明确保持 unverified

## 当前状态

resolved

## 处理结果

实现、自动化验证和用户真实 native-host 验收均已完成。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `design.md`

## 验证方式

- typecheck、build、widget runtime smoke、MCP smoke 和 plugin validator 已通过

## 后续风险

- 无已知后续风险；用户已确认真实 native widget 表现正常。
