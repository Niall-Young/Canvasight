---
schema_version: 1
report_id: issue-framework-choice-figma-kit-parity
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: medium
version: 3
agent_id: /root/development_agent
thread_id: 019f6ac3-8c21-7063-9a57-4a45a3848e79
created_at: 2026-07-16T12:42:15Z
updated_at: 2026-07-16T12:58:28Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/FrameworkQuestionsCard.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Figma design context and screenshots were fetched for checkbox nodes 347:1435 and 347:1453 and radio nodes 347:1444 and 347:1462.
  - Production build and composed widget runtime passed with light and dark token-resolved geometry assertions.
  - Playwright verified selected and unselected radio and checkbox states at 760px and 360px with no horizontal overflow.
  - Runtime verifies selected keyboard focus uses the active theme focus token and returns to connecting-border with no shadow after blur.
  - Follow-up runtime and Playwright evidence confirms custom-answer textareas resolve to background-input instead of background-raised in light and dark themes.
solution_report: agent-reports/resolved/solution-framework-choice-figma-kit-parity.md
---

# 框架提问单选与多选未完全还原 Scatter UI Kit

## TL;DR

框架提问沿用了部分 Canvasight 类名，但选项卡、推荐标签和持久选中态仍未精确匹配用户指定的 Scatter Figma 组件。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

用户要求单选和多选按 `UI kits for Scatter` 的 Figma 节点还原，并使用仓库已有亮暗主题变量。

## 现象

- 选中项继承旧 provider card 的 focus border 与 shadow。
- 推荐状态只是灰色行内文字，而不是 Figma tag。
- radio 内点、控件首行对齐和文字规格未被精确锁定。

## 复现方式

1. 渲染含 single 和 multiple 问题的 framework confirmation。
2. 选择一项并切换 light/dark theme。
3. 对比 Figma 节点 347:1435、347:1453、347:1444、347:1462。

## 影响范围

仅影响 inline framework confirmation 的 preset choice 视觉与自动化验收；原生表单语义、bridge、持久化和 Graph Writer 合同不受影响。

## 证据

- Figma context 给出 16px controls、2px border、12px item radius、12x16 padding、12px gap 与 14/22 typography。
- Figma selected nodes 给出 connecting border、dark fill、inverted mark 和无额外 shadow 的状态。

## 初步归因

前一轮只复用了近似的 provider-card 与 kit-checkbox selector，没有把 Figma 的完整状态矩阵写成 framework-specific override 和 theme-resolved regression。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何精确还原 radio 和 checkbox 而不破坏原生输入语义？
- 如何确保 light/dark 都只使用现有 semantic tokens？

## 相关文件

- `plugins/canvasight/src/components/FrameworkQuestionsCard.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`

## 期望结果

单选、多选、推荐标签和选中项均与指定 Figma 节点一致，并在亮暗主题中通过同一 token 合同反转。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已按四个 Figma 状态节点完成还原，并补齐 light/dark 与 360px 回归；后续按用户截图纠正 textarea 的级联覆盖，使自定义答案输入框也使用 background-input。

## 修改文件

- `plugins/canvasight/src/components/FrameworkQuestionsCard.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/dist/`
- `design.md`

## 验证方式

- `npm run build`
- `npm run test:widget-runtime`
- `npm run check:mcp-bundle`
- Playwright light / dark / 360px screenshots and computed styles

## 后续风险

当前任务已加载的插件资源不会热刷新 repo-local 构建；本轮不把浏览器证据表述为 native-host 新版本验收。
