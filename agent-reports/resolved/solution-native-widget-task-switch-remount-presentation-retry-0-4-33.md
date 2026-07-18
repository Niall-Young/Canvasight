---
schema_version: 1
report_id: solution-native-widget-task-switch-remount-presentation-retry-0-4-33
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f744d-c7f1-7383-8195-7478c2cd835e
created_at: 2026-07-18T09:57:09Z
updated_at: 2026-07-18T09:57:09Z
depends_on:
  - issue-native-widget-task-switch-remount-blank-0-4-32
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Focused 0.4.33 widget runtime smoke restores a fresh zero-size instance on its second fullscreen request without rehydration or size notifications.
  - A permanently zero-size host receives exactly one initial request and two retries, never reports ready, and opens the project only once.
  - Test Supervisor independently passed the frozen 0.4.33 widget runtime, typecheck, build, MCP bundle, release verify and diff checks.
---

# 用有界 fullscreen re-presentation 恢复 task-switch fresh Widget

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-native-widget-task-switch-remount-blank-0-4-32.md`（读取版本：1）

## Root Cause

Codex task return 会创建 fresh native WebView。0.4.32 的 bridge connect 只 fire-and-forget 请求一次 fullscreen；项目水合后如果宿主仍未完成 presentation/layout，应用只被动等待 visibility、host context、ResizeObserver、非零尺寸与 hit-test。现场同一实例在侧边栏重开后立即 ready，证明缺失的是宿主 presentation actuator，而不是 daemon、session、project 或数据恢复。

## 调研过程

1. 对照 lifecycle，确认 fresh instance 在 234ms 内完成 bridge/session/project API，之后 17 秒没有 API 或错误。
2. 侧边栏重开后同一 instance 立即以 788×794 ready，排除重新 session、重新水合或数据修复。
3. 审查 bridge：标准 fullscreen request 只在 connect 后执行一次。
4. 审查 App：`waitForRenderableCanvas` 每 100–200ms 醒来，但没有主动重新请求宿主 presentation。
5. 保留 strict ready gate，选择标准 `ui/request-display-mode` 作为最窄的宿主布局重申机制。

## 推荐方案

bridge 暴露带 1250ms timeout 的 `requestFullscreenPresentation()`。App 在 hydration 完成但画布仍不可渲染时，于约 250ms 和再约 1s 后各重试一次。每次 await 后检查 binding；请求失败仅作为 best-effort，30 秒 strict renderability gate 继续决定 ready/failed。

不发送 `ui/notifications/size-changed`，不 reload、rehydrate、fitView 或新建 session/open attempt，不降低 document visible、fullscreen、connected、正尺寸、CSS visible 和 hit-test 门槛。

## 风险与回滚

- 宿主可能忽略重复 fullscreen 请求；两次重试有硬上限，失败仍进入原有 30 秒可见错误，不会无限请求或 false-ready。
- binding 在请求期间变化会立即停止旧初始化流程，避免迟到实例报告 ready。
- 可回滚 App/bridge 的 presentation retry 与对应测试；不涉及 `.scatter` 数据、保存或 Run 合同。

## 处理结果

0.4.33 已实现有界 fullscreen re-presentation。fake host 第一次请求返回 fullscreen 但保持 0×0，第二次请求才布局；同一实例只 ready 一次且 project open 只有一次。永久 0×0 fixture 证明总请求严格为三次、ready 为零、size-changed 为零。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- 0.4.33 manifest/package/lock、MCP bundle 与 web dist

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:widget-runtime`
- `npm run check:mcp-bundle`
- 完整本地测试矩阵、`release:verify -- 0.4.33` 与 plugin validator

## 后续风险

自动化只能证明标准 re-presentation 请求的边界，不能替代真实 Codex Desktop compositor/layout。issue 保持 assigned，直到 exact 0.4.33 重启后在不折叠侧边栏的条件下完成至少两轮 A→B→A。
