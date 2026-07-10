---
status: resolved
report_type: solution
owner: Design Agent
created_by: Design Agent
priority: high
created_at: 2026-07-10 15:13
updated_at: 2026-07-10 15:13
related_issue: agent-reports/assigned/20260710-1506-design-issue-native-startup-states.md
related_files:
  - plugins/canvasight/src/components/CanvasightErrorBoundary.tsx
  - plugins/canvasight/src/components/StartupFailurePanel.tsx
  - plugins/canvasight/src/components/WorkspaceStartupSkeleton.tsx
  - plugins/canvasight/src/styles/app.css
  - design.md
---

# 原生启动与失败状态 UI 设计方案

## 负责 Agent

Design Agent `/root/design_agent_v2`

## 对应问题

`agent-reports/assigned/20260710-1506-design-issue-native-startup-states.md`

## Root Cause

旧启动反馈是脱离真实 React workspace 的临时反馈，无法在 React 渲染失败、阶段超时或 session/hydration 失败时提供持续、可操作且可访问的恢复界面。设计基线也只有笼统 Starting/Connecting，未覆盖单调阶段、fullscreen 验收与迟到事件边界。

## 调研过程

- 检查现有 `app.css` token、Button/Icon 组件和工作区视觉结构，沿用中性 canvas、紧凑控件与现有 focus 语言。
- 将 startup surface 拆为 skeleton、持久 failure panel、ErrorBoundary 三个独立组件，避免 UI 组件自行决定 attempt/session/task 导航。
- 对照原生 ready 要求补齐 React commit、bridge、fullscreen context、session、hydration 与有尺寸 canvas DOM 条件。

## 可选方案

- 方案 A：继续用浮层 toast 表示 Connecting/Failed。无法承载持续错误、焦点与恢复动作。
- 方案 B：React 第一帧渲染 workspace skeleton，失败后由同一 React 树持久替换为 failure panel。采用此方案。

## 推荐方案

主线程在 `App.tsx` / startup runtime 集成三个组件：非终态渲染 `WorkspaceStartupSkeleton`，终态失败渲染 `StartupFailurePanel`，workspace 外层使用 `CanvasightErrorBoundary`。所有恢复动作通过 props 回调注入，状态推进仍由 OpenAttempt runtime 唯一负责。

## 实施步骤

1. 新增四阶段 workspace skeleton，禁用 session-dependent affordances 并提供 polite live status。
2. 新增 persistent failure panel，展示 stage/reason，支持 reconnect、新任务重开、复制脱敏诊断。
3. 新增 ErrorBoundary，将 React render exception 统一映射为 `react_render` failure。
4. 增加 responsive、dark-token、focus-visible 与 reduced-motion 样式。
5. 更新 `design.md` 为单调 startup 状态机与 fullscreen Ready 验收标准。

## 风险与回滚

组件尚未接入 `App.tsx`，当前生产 bundle 不会显示这些新状态；由主线程集成后才可进行组合测试与真实宿主验收。若集成冲突，可先保留 `design.md`，删除三个未引用组件及 `app.css` 末尾 scoped 样式，不影响现有画布业务状态。

## 处理结果

Design Agent 负责的组件、样式与设计基线已完成；原生链路是否修复仍为 assigned/unverified。

## 修改文件

- `plugins/canvasight/src/components/CanvasightErrorBoundary.tsx`
- `plugins/canvasight/src/components/StartupFailurePanel.tsx`
- `plugins/canvasight/src/components/WorkspaceStartupSkeleton.tsx`
- `plugins/canvasight/src/styles/app.css`
- `design.md`

## 验证方式

- `npm run typecheck`：通过。
- `npm run build`：通过，保留既有 bundle size warning。
- `git diff --check`：通过。
- 静态可访问性检查：failure heading 自动聚焦、assertive/polite live regions、键盘按钮、focus-visible、disabled skeleton controls、reduced-motion 均已定义。

## 后续风险

- 需 Development Agent 在 `App.tsx` 与 startup runtime 中接入，且不得让 UI 回调自行绕过 attempt/thread/fullscreen instance 绑定。
- 需 Test Supervisor 用完整生成 widget HTML 和真实 native host 验证 overlay 退出、失败面板、canvas 可操作与迟到事件不回退。
- 真实 fullscreen Ready、控件与 Run 未在本设计子任务中验证，issue 保持 assigned。
