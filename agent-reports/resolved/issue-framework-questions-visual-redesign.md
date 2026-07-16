---
schema_version: 1
report_id: issue-framework-questions-visual-redesign
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: medium
version: 1
agent_id: /root/development_agent
thread_id: 019f6ac3-8c21-7063-9a57-4a45a3848e79
created_at: 2026-07-16T11:59:10Z
updated_at: 2026-07-16T12:01:20Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/FrameworkQuestionsCard.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Production build and composed widget runtime smoke passed.
  - Playwright verified light, dark, 760px, and 360px layouts without horizontal overflow.
  - Responsive smoke now requires a compact card, single-column choices, no overflow, and full-width narrow submit action.
solution_report: agent-reports/resolved/solution-framework-questions-visual-redesign.md
---

# 框架提问表单视觉过重且层级杂乱

## TL;DR

现有内联提问表单呈现为大圆角设置页，并在卡片中重复嵌套选项卡，信息密度和消息流场景不匹配。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

用户在真实 `ask_canvasight_framework_questions` 组件中确认当前样式后，明确反馈“太丑了”。审查发现实现偏离 `design.md` 已定义的紧凑对话确认面板基线。

## 现象

- 760px 宽、18px 大圆角和明显阴影让组件像独立设置页。
- 选项使用多列嵌套卡片，长说明阅读拥挤并形成“卡中卡”。
- 大写眉题、圆形序号、灰底 textarea 与 64px footer 增加装饰和松散感。
- 成功后仍保留整张 disabled 表单，答案摘要不够直接。

## 复现方式

1. 调用 `ask_canvasight_framework_questions` 渲染一题三选项表单。
2. 在 Codex 消息流中观察标题、选项、自定义输入和提交区。
3. 对比 `design.md` 的 Inline Framework Confirmation 基线。

## 影响范围

消息内框架确认组件的视觉层级、响应式阅读、主题呈现和成功摘要；提问、bridge、持久化与 Graph Writer 合同不受影响。

## 证据

- 用户直接反馈当前表单样式不可接受。
- Design Agent 与 Development Agent 独立审查均定位到宽度、大圆角、多列选项和嵌套卡片问题。
- Playwright 初始预览复现了消息内设置页观感。

## 初步归因

实现沿用了较宽、较松的面板表达，没有严格落实 `design.md` 已要求的紧凑单列对话组件。

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

表单成为更窄、更紧凑、单列、低装饰的对话确认面板；选中、输入、发送和成功摘要状态清晰，深浅主题与窄屏均无溢出。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已完成视觉重构并通过构建、浏览器运行时和响应式可视验证。

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
