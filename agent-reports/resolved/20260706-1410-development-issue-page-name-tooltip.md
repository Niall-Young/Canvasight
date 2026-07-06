---
status: resolved
report_type: issue
owner: Development Agent
created_by: Product Agent
priority: medium
created_at: 2026-07-06 14:10
updated_at: 2026-07-06 14:22
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/styles/app.css
  - design.md
solution_report: agent-reports/resolved/20260706-1422-development-solution-page-name-tooltip.md
---

# Page 长名称省略后缺少完整名称提示

## TL;DR

Page switcher 触发器和页面下拉菜单里的长名称被省略后，悬停或聚焦时没有展示完整 Page 名。

## 发现者

User

## 提交 Agent

Product Agent

## 建议交接 Agent

Development Agent

## 问题描述

当 Page 名称较长时，触发器和下拉菜单项会按设计单行省略，但用户无法在当前 UI 中看到完整名称，导致多个相似长名称之间难以辨认。

## 现象

- `.canvas-page-trigger-label` 显示省略号。
- `.canvas-page-menu .kit-dropdown-menu-item-label` 显示省略号。
- hover 后没有使用现有 `TooltipAnchor` 显示完整名称。

## 复现方式

1. 创建或重命名一个较长的 Page 名。
2. 观察左上角 Page switcher 触发器。
3. 打开 Page 下拉菜单，观察长 Page 名菜单项。
4. 分别悬停触发器和菜单项。

## 影响范围

影响 Page 切换和辨认体验，不影响画布数据本身。

## 证据

- 用户截图显示 `Personal...`、`Personal Website B...`、`Execution Canvas - Pers...` 被省略。
- 当前 `App.tsx` 仅渲染文本和菜单项，没有给这些长文本绑定 tooltip。

## 初步归因

Page switcher 复用了省略样式，但没有把完整 Page 名接入现有 tooltip 组件。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何复用现有 `TooltipAnchor` 并避免破坏 Radix DropdownMenu 触发、菜单项点击和键盘行为？
- 是否需要为长 Page 名 tooltip 增加最大宽度和换行样式？

## 相关文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/styles/app.css`

## 期望结果

Page 触发器和下拉菜单项在 hover/focus 时展示完整 Page 名，且不影响切换、重命名、删除或菜单关闭逻辑。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。Page switcher 触发器和页面菜单项现在复用现有 `TooltipAnchor`，在长名称省略时可通过 hover/focus 查看完整 Page 名。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/dist/`
- `design.md`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260706-1422-development-solution-page-name-tooltip.md`
- `agent-reports/resolved/20260706-1422-integration-summary-page-name-tooltip.md`

## 验证方式

- `npm run typecheck`
- `npm run build`
- bundled Playwright headless hover/focus verification against `http://127.0.0.1:5173/`
- `git diff --check`

## 后续风险

- Tooltip 会对所有 Page 名显示，不只在真实 overflow 时显示；这是有意保守实现，避免引入运行时测量和状态同步复杂度。
