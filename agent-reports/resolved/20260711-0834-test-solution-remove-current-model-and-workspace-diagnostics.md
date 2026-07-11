---
status: resolved
report_type: solution
owner: Test Supervisor Agent
created_by: Test Supervisor Agent
priority: medium
created_at: 2026-07-11 08:34
updated_at: 2026-07-11 08:34
related_issue: null
related_files:
  - plugins/canvasight/shared/types.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/SettingsDialog.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/components/StartupFailurePanel.tsx
---

# 移除当前模型设置与工作区诊断入口测试

## 负责 Agent

Test Supervisor Agent

## 对应问题

用户确认“Codex 当前模型”仅服务已废弃的 Plan / Goal 流程；随后确认工作区手动 Diagnostics 按钮与面板也不再需要，但启动失败时的诊断复制能力必须保留。

## Root Cause

Chat-only Run 已不消费前端模型偏好，但该字段、设置控件与 Run 载荷仍保留。工作区还保留了一个面向用户的 bridge Diagnostics 入口，其用途同样来自已经移除的 Plan / Goal 诊断流程。

## 调研过程

- 审查共享设置、设置弹窗、Run payload/response、翻译及 `App.tsx` 的调用链。
- 复扫源码：`codexModel` 仅存于 `loadStoredAppSettings` 的旧 localStorage 兼容清理分支，不再是设置、payload 或显示文本。
- 复扫工作区 Diagnostics：`CanvasightDiagnosticsPanel`、`diagnosticsOpen`、工具栏入口及 `.canvas-diagnostics-*` 样式均已移除；`StartupFailurePanel` 及其 Copy diagnostics 文案/逻辑仍存在。
- 以 Playwright 打开 `http://127.0.0.1:5173/`，页面标题为 Canvasight，裸开发页显示“Open Canvasight from a Codex project to create a workspace.”

## 推荐方案

保留旧 localStorage 字段的一次性规范化删除，删除用户可见的当前模型/工作区 Diagnostics 表面；保留启动失败面板的受控诊断复制。

## 实施步骤

1. 删除 `AppSettings`、SettingsDialog、翻译和 Run API 的当前模型字段。
2. 删除工作区 Diagnostics 状态、按钮、面板、相关样式和仅供该面板使用的翻译。
3. 保留 `StartupFailurePanel` 的诊断信息和复制动作。

## 风险与回滚

旧 localStorage 的 `codexModel` 会在读取时被移除；如未来确实需要用户选择模型，应以独立于 Chat-only Run 的产品契约重新设计。工作区不再提供 bridge 运行时详情；启动失败仍能复制经过脱敏的诊断信息。

## 处理结果

自动化构建与源码回归检查通过：没有当前模型的设置/载荷/UI，也没有工作区 Diagnostics 入口或面板；启动失败诊断保留。

## 修改文件

- `plugins/canvasight/shared/types.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/SettingsDialog.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`

## 验证方式

- `npm run typecheck` — 通过。
- `npm run build` — 通过（仅有既有的大 chunk 警告）。
- 源码扫描确认 `codexModel` 仅作为旧 localStorage 迁移键存在；不存在 `settings.codexModel`、中英文当前模型显示文本或 Run payload 字段。
- 源码扫描确认无 `CanvasightDiagnosticsPanel`、`diagnosticsOpen`、`diagnostics.open` 或 `.canvas-diagnostics-panel`；`StartupFailurePanel` 的 `copyDiagnostics`、`diagnosticsCopied` 与 `diagnosticsCopyFailed` 仍存在。
- Playwright 可见性尝试：裸开发页可加载，但没有 Codex 项目/原生 widget session，按产品约束阻止进入工作区和 SettingsDialog。

## 后续风险

原生 Codex widget 仍未在本轮获得可用的具体 task/session，因此无法在真实宿主中点击 Settings 并截图确认字段消失，也无法以宿主界面确认工作区按钮消失。此限制不影响构建、静态链路或裸开发页加载结论；若需要满足原生宿主验收，需重载/重启 Codex Desktop 后，在新建并绑定的 task 中安装当前插件版本并实际打开 widget。
