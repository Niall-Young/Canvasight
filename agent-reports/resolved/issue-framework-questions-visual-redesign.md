---
schema_version: 1
report_id: issue-framework-questions-visual-redesign
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: medium
version: 2
agent_id: /root/development_agent
thread_id: 019f6ac3-8c21-7063-9a57-4a45a3848e79
created_at: 2026-07-16T11:59:10Z
updated_at: 2026-07-16T12:16:49Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/FrameworkQuestionsCard.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - JSX now directly reuses KitButton, assistant-provider-card, settings-dialog-input, and kit-checkbox visual primitives from the original Canvasight workspace.
  - Production build, composed widget runtime, clean distribution, and plugin validation passed.
  - Playwright verified the black KitButton, provider-card selection, settings input, light/dark themes, and 760px/360px layouts.
solution_report: agent-reports/resolved/solution-framework-questions-visual-redesign.md
---

# 框架提问表单未复用 Canvasight 组件语言

## TL;DR

首轮紧凑化改造仍使用蓝色旧 Button 和 framework 专属选择样式，没有复用 Canvasight / Scatter 已有的黑色 KitButton 与 kit 组件语言。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

用户在真实 `ask_canvasight_framework_questions` 组件中先后确认原始样式与首轮改造，明确指出首轮结果仍与 Canvasight 组件不一致，并要求直接照搬 Canvasight / Scatter 已有组件。

## 现象

- 提交仍使用旧 `Button variant="primary"`，因此是蓝色按钮，而非 Canvasight dialogs 的黑色 `KitButton`。
- 选中态、推荐 badge、focus ring 和 disabled button 都是 framework 专属蓝色规则。
- 首轮新增蓝点、题数和两位数序号，但这些并不存在于 Canvasight / Scatter 组件家族。

## 复现方式

1. 调用 `ask_canvasight_framework_questions` 渲染一题三选项表单。
2. 在 Codex 消息流中观察标题、选项、自定义输入和提交区。
3. 对比 `design.md` 的 Inline Framework Confirmation 基线。

## 影响范围

消息内框架确认组件的视觉层级、响应式阅读、主题呈现和成功摘要；提问、bridge、持久化与 Graph Writer 合同不受影响。

## 证据

- 用户明确指出 Canvasight 使用黑色按钮，并要求复用已有命名组件。
- `79edfb9` 已提供 `KitButton`、`assistant-provider-card`、`kit-checkbox` 与 settings input 视觉。
- computed style 证明首轮按钮来自旧 `.ui-button-primary`，而非 `.kit-button.is-filled`。

## 初步归因

首轮只按视觉直觉重画了 framework 专属 CSS，没有先审计 `components/ui/*` 与原 Scatter 迁移提交，因而选错了旧 Button 家族并新造了一套选择态。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何在不改变现有表单语义和提交合同的前提下明显改善视觉？
- 如何让宽屏和窄屏都保持单列、无溢出和稳定操作区？

## 相关文件

- `plugins/canvasight/src/components/FrameworkQuestionsCard.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`

## 期望结果

表单直接使用 Canvasight 的黑色 KitButton、provider selection card、kit checkbox 和 settings input 语言；不再保留 framework 专属蓝色视觉。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已按用户反馈纠正首轮方案，直接复用 Canvasight / Scatter 现有组件与类，并通过构建、运行时和浏览器同源验证。

## 修改文件

- `plugins/canvasight/src/components/FrameworkQuestionsCard.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/dist/`

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:widget-runtime`
- Playwright 760px / 360px、light / dark 截图与 overflow 检查

## 后续风险

当前任务已加载的插件快照不会热刷新本次 repo-local 样式；真实 Codex native-host 中查看新版需要后续版本化安装并重启宿主。
