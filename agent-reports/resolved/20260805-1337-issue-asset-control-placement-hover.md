---
status: resolved
report_type: issue
owner: Development Agent
created_by: Main Thread
priority: medium
created_at: 2026-08-05 13:37
updated_at: 2026-08-05 13:41
related_files:
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/components/ui/action-menu-item.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
solution_report: agent-reports/resolved/20260805-1341-development-solution-asset-control-placement-hover.md
---

# Asset 分类选中标记与视频 More 悬停样式错误

## TL;DR

分类下拉的选中标记已移到文字右侧，视频节点 More 在所有可见状态均改为不透明主题 surface。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

Asset 分类下拉中，当前值的勾选图标抢占了 label 左侧位置；视频 Asset 的 More 在 hover 时失去实心浅色背景，导致按钮与视频画面混在一起。

## 现象

- 选中项 check 出现在 label 左侧。
- 视频节点 More hover 时背景透明，图片内容直接透出。

## 复现方式

1. 在任意 Asset 左上角打开分类下拉。
2. 观察当前分类的 check 与 label 位置。
3. 悬停真实视频 Asset，观察右上 More 的背景。

## 影响范围

Asset 分类下拉的选中状态排布，以及视频 Asset 浮层操作的可读性。

## 证据

- 用户提供的三张验收截图。
- Playwright 修复前与修复后 computed style、布局坐标和截图。

## 初步归因

Action menu item 复用了左侧 icon 槽表达选中状态；通用 plain IconButton hover 规则在 Asset 专用背景规则之后覆盖了背景色。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 已用可选 trailing icon 槽将选中标记固定到 label 右侧。
- 已用 Asset 限定选择器覆盖 base、hover、focus-visible 与 open 背景。

## 相关文件

- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/components/ui/action-menu-item.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`

## 期望结果

分类 check 位于 label 右侧且四项文字对齐；视频 More 的浮层背景始终清晰、不透出画面，默认仍隐藏。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。分类 check 使用固定宽度右侧槽；Asset More 所有可见状态使用不透明主题 surface。

## 修改文件

- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/components/ui/action-menu-item.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/dist/`

## 验证方式

- `npm run build`
- `npm run test:asset-presentation`
- `npm run check:mcp-bundle`
- Playwright 分类布局与真实视频 More 四状态验收

## 后续风险

真实 Codex native-host 本轮未重启验收；浏览器 fixture 证据不能替代原生宿主 gate。
