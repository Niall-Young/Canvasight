---
status: assigned
report_type: issue
owner: Design Agent
created_by: main-thread
priority: high
created_at: 2026-07-10 15:06
updated_at: 2026-07-10 15:13
related_files:
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/components/CanvasightErrorBoundary.tsx
  - plugins/canvasight/src/components/StartupFailurePanel.tsx
  - plugins/canvasight/src/components/WorkspaceStartupSkeleton.tsx
  - design.md
solution_report: agent-reports/resolved/20260710-1513-design-solution-native-startup-states.md
agent_id: /root/design_agent_v2
---

# 原生启动与失败状态 UI 重构

## 问题描述

原生 widget 以独立 shell toast 表示 Starting/Connecting，React 未显示或发生异常时会留下整屏空白且无法恢复。需要让真实 React shell 统一拥有单调启动状态，并提供持久、可操作的 Failed 界面。

## 期望结果

- 提供 React ErrorBoundary 和可复用 StartupFailurePanel。
- workspace skeleton 在启动期可见，依赖 session 的控件禁用。
- Failed 显示阶段、简短原因、重新连接、在新任务重开和复制诊断。
- `design.md` 与实际状态模型一致。

## 当前状态

assigned；Design Agent `/root/design_agent_v2` 已完成组件、样式和设计基线，并写入 solution report。等待 Development Agent 接入 `App.tsx` / runtime 以及 Test Supervisor 完成组合与真实宿主验收；在此之前保持 assigned/unverified。

## 处理结果

已完成 `WorkspaceStartupSkeleton`、`StartupFailurePanel`、`CanvasightErrorBoundary` 及相应 responsive/accessibility 样式；`design.md` 已同步单调 startup 状态机、Ready 验收和持久失败规范。

## 修改文件

- `plugins/canvasight/src/components/CanvasightErrorBoundary.tsx`
- `plugins/canvasight/src/components/StartupFailurePanel.tsx`
- `plugins/canvasight/src/components/WorkspaceStartupSkeleton.tsx`
- `plugins/canvasight/src/styles/app.css`
- `design.md`

## 验证方式

- `npm run typecheck`：通过。
- `npm run build`：通过。
- `git diff --check`：通过。

## 后续风险

组件尚未接入 `App.tsx` 与 OpenAttempt runtime，生产 widget 与真实 fullscreen host 尚未验收，不能据此声称原生链路已 ready 或 fixed。

## Closure Criteria

- [x] 组件与样式完成
- [x] design.md 回写
- [x] 构建与可访问性检查完成
- [ ] 真实宿主失败状态仍需主线程验收
