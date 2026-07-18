---
schema_version: 1
report_id: solution-manual-canvas-latest-revision-refresh
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-17T15:59:50Z
updated_at: 2026-07-17T15:59:50Z
depends_on:
  - issue-manual-canvas-latest-revision-refresh
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Latest revision loads through the existing open-project endpoint.
  - Pending saves settle before refresh and duplicate clicks share one request.
  - Lower late revisions and in-flight local edits are not applied.
---

# 安全加载画布最新 revision

## Root Cause

自动 revision poll 有意受 fullscreen、焦点、可见性、租约和本地 dirty 状态约束，界面缺少不依赖 poll lease 的主动恢复入口。

## 推荐方案与处理结果

复用既有 `openProject`，在右上全局工具组新增 rotate-arrow 刷新动作。刷新等待现代保存管线完成，响应返回后再次检查项目、mutation generation 与 revision 单调性；只有安全时才用 `preserveLocalNavigation` 应用结果。按钮提供 busy、单飞、双语 tooltip/aria 和成功/失败 Toast。

## 风险与回滚

删除按钮、翻译与刷新 callback 即可回滚；不涉及 daemon API、数据格式或 MCP runtime 版本。
