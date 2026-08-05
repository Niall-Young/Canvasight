---
status: resolved
report_type: issue
owner: Development Agent
created_by: Main Thread
priority: high
created_at: 2026-08-05 13:48
updated_at: 2026-08-05 13:56
related_files:
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/components/ScatterEdge.tsx
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
solution_report: agent-reports/resolved/20260805-1356-development-solution-edge-connect-layer.md
---

# Edge 与端帽绘制在节点连接按钮上方

## TL;DR

Asset hover/selected 时，蓝色 Edge 与端帽曾从黑色 `+` 按钮上方穿过；现已通过明确的 Group、Edge、Task/Asset 层级和外缘端点修复。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

左右连接按钮本应完整覆盖其下方 Edge 端点，但 Edge SVG 的堆叠层级高于 nodes layer，使蓝色路径和端帽切开黑色按钮及白色 `+`。

## 现象

- 节点 hover 或 selected 后，左右黑色 `+` 按钮中间出现蓝色竖条。
- `elementsFromPoint` 在按钮中心首先返回 Edge interaction/path，而非按钮或图标。

## 复现方式

1. 打开包含已连接图片 Asset 的 Canvasight Page。
2. 悬停或选择图片 Asset，使左右连接按钮显示。
3. 观察已有蓝色 Edge 与端帽覆盖按钮中心。

## 影响范围

Task/Asset 连接按钮、Edge 端点显示、已有 Edge 点击/选中与新连接预览的层级。

## 证据

- 用户验收截图。
- 修复前 Edge SVG computed `z-index: 2`，nodes layer computed `z-index: 1`。
- 修复前 Playwright `elementsFromPoint` 显示 Edge path 位于 button 上方。

## 初步归因

`.react-flow__nodes` 的固定 `z-index: 1` 建立了父堆叠上下文，节点内部按钮无法跨过由 XYFlow 提升到 `z-index: 2` 的 Edge SVG。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何让节点与连接按钮覆盖 Edge，同时保留 Edge 可点击/选中？
- 如何避免 Group 背景、连接预览和其他节点层级回归？

## 相关文件

- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/src/components/ScatterEdge.tsx`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`

## 期望结果

左右 `+` 按钮完整显示，Edge/端帽在其下方终止；已有 Edge 仍可点击、选中和高亮，新连接预览正常。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。nodes 容器不再形成统一堆叠上下文，Group、Edge、Task/Asset 分别保持 `0`、`1`、`2`；Edge 端点与端帽终止在连接按钮外缘。

## 修改文件

- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/src/components/ScatterEdge.tsx`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/*`

## 验证方式

- Playwright 检查 hover/selected 两侧按钮的 `elementsFromPoint` 顶层。
- Playwright 点击 Edge 中段并验证选中高亮。
- Playwright 验证 Group 内 Edge 可见、拖线预览及真实新建 Edge。
- `npm run test:asset-presentation`
- `npm run typecheck`
- `npm run build`

## 后续风险

浏览器开发表面已验收；本轮未重装插件或重启 Codex Desktop，因此不把浏览器结果等同于原生 Widget 验收。
