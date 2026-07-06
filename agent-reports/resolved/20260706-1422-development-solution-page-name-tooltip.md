---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: medium
created_at: 2026-07-06 14:22
updated_at: 2026-07-06 14:22
related_issue: agent-reports/resolved/20260706-1410-development-issue-page-name-tooltip.md
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/styles/app.css
  - design.md
---

# Page 长名称 tooltip 解决方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1410-development-issue-page-name-tooltip.md`

## Root Cause

Page switcher 触发器和页面菜单项已经使用稳定宽度与省略样式，但没有把原始完整 Page 名接入现有 tooltip 体系。

## 调研过程

- 确认 `plugins/canvasight/src/App.tsx` 中 Page switcher 使用 `RadixDropdownMenu.Trigger asChild` 和 `DropdownMenuItem`。
- 确认项目已有 `TooltipAnchor` 和 `kit-tooltip` 样式，可复用，不需要新增 tooltip 组件。
- 浏览器验证时发现长文本 tooltip 如果只设置 `max-width`，菜单右侧 tooltip 会被压成过窄竖列，因此补充 `width: max-content` 与换行约束。

## 可选方案

- 方案 A：给按钮和菜单项加浏览器原生 `title`。实现简单，但样式不可控，也可能和现有 UI kit tooltip 重叠。
- 方案 B：复用 `TooltipAnchor` 包裹 Radix trigger/item 的内部 button 结构。实现稍多，但视觉和交互一致。

## 推荐方案

采用方案 B。保持结构为 `TooltipAnchor -> RadixDropdownMenu.Trigger asChild -> button` 和 `TooltipAnchor -> RadixDropdownMenu.Item asChild -> DropdownMenuItem`，避免把 Radix 语义挂到 tooltip `span` 上。

## 实施步骤

1. 在 Page trigger 外层接入 `TooltipAnchor`，tooltip 内容为完整 active Page 名。
2. 在每个 Page 菜单项外层接入 `TooltipAnchor`，tooltip 内容为对应完整 Page 名。
3. 给长文本 tooltip 增加宽度、最大宽度和换行约束，避免极长名称竖排。
4. 更新 `design.md`，明确截断 switcher 名称需要 hover/focus 展示全名。
5. 重新构建 `dist/`。

## 风险与回滚

风险主要在 Radix 菜单结构增加一层 tooltip anchor 后可能影响键盘和关闭行为；已用 headless 浏览器验证 Esc 可关闭菜单。回滚方式是移除本次 `TooltipAnchor` 包裹和 `.kit-tooltip-wrap` 样式。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/dist/`
- `design.md`
- `agent-reports/QUEUE.md`

## 验证方式

- `npm run typecheck`：通过。
- `npm run build`：通过，保留既有 Vite chunk size warning。
- bundled Playwright headless：构造长 Page 名，确认 trigger 和 menu label 都 overflow；hover/focus 后 tooltip 可见、文本完整、长文本宽度稳定；Esc 可关闭菜单。
- `git diff --check`：通过。

## 后续风险

- 当前实现会统一显示 tooltip，不只在真实省略时显示。若后续需要只在 overflow 时显示，可新增测量 hook，但需要避免引入布局抖动。
