---
status: resolved
report_type: issue
owner: Development Agent
created_by: Main Thread
priority: high
created_at: 2026-08-05 14:07
updated_at: 2026-08-05 14:15
related_files:
  - plugins/canvasight/src/components/ScatterEdge.tsx
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
solution_report: agent-reports/resolved/20260805-1415-development-solution-edge-endpoint-gap.md
---

# Edge 端点与节点边缘悬空回归

## TL;DR

上一轮把持久 Edge 端点向节点外侧偏移 10px，导致按钮隐藏时 Edge 与节点边缘出现可见空隙；现已按当前 XYFlow Handle 的真实 DOM 几何恢复为向内半个 Handle 宽度。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

图片 Asset 与相邻节点之间的 Edge 在两端都没有贴住节点，蓝色端帽悬浮在节点外侧。

## 现象

- 持久 Edge 左右端帽与节点边缘之间出现白色空隙。
- 在当前 `0.72` viewport scale 下，逻辑 10px 外向偏移表现为两侧各 `7.2px` 可见间隙。

## 复现方式

1. 打开含既有 Edge 的图片 Asset Page。
2. 移开鼠标使连接按钮隐藏。
3. 观察 Edge 端帽与左右节点边缘没有连接。

## 影响范围

所有使用 `ScatterEdge` 的持久 Edge，包含 Task、Asset 与 Group 内成员连接。

## 证据

- 用户验收截图。
- `4b9d8e0` 中 `nodeEdgeX` 为左侧 `x - 10`、右侧 `x + 10`。
- Playwright 实测 outward 和 direct 两种方案都在 reference 节点左右产生约 `7.2px` screen-space gap。
- DOM 实测 `sourceX/targetX` 等于 20px Handle 外缘，Handle 中心才等于节点边界。

## 初步归因

错误假设 XYFlow 的 Edge 坐标位于 Handle 中心。当前版本实际返回 Handle 外缘，因此必须向节点内侧换算半个 20px Handle 宽度。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何让持久 Edge 精确连接节点边界，同时由正确层级解决按钮遮挡？
- 如何用几何断言防止外向或 direct 方案再次引入间隙？

## 相关文件

- `plugins/canvasight/src/components/ScatterEdge.tsx`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`

## 期望结果

非 hover 时 Edge 贴住节点边缘；hover/selected 时黑色按钮完整覆盖 Edge 且优先接收事件。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复。左侧端点使用 `x + 10`，右侧端点使用 `x - 10`，将 Handle 外缘换算为节点边界；上一轮正确的层级修复保持不变。

## 修改文件

- `plugins/canvasight/src/components/ScatterEdge.tsx`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/*`

## 验证方式

- Playwright 像素几何断言、非 hover/hover/selected 截图与 hit-test。
- Edge 点击/选中、Group 内 Edge、拖线预览和真实新建 Edge。
- `npm run test:asset-presentation`
- `npm run typecheck`
- `npm run build`

## 后续风险

浏览器开发表面已验收；真实 Codex native Widget 本轮未重装/重启宿主后验收，保持 unverified。
