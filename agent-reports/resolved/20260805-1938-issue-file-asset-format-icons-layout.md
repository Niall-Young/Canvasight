---
status: resolved
report_type: issue
owner: Development Agent
created_by: Main Thread
priority: high
created_at: 2026-08-05 19:38
updated_at: 2026-08-05 19:48
related_files:
  - plugins/canvasight/src/assets/icons
  - plugins/canvasight/src/lib/assetPresentation.ts
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
solution_report: agent-reports/resolved/20260805-1948-development-solution-file-asset-format-icons-layout.md
---

# 文件 Asset 图标与横排布局不符合设计

## TL;DR

文件 Asset 当前仅显示一个居中的通用占位图标，未使用用户提供的格式 SVG，也没有参考设计中的图标加文件信息横排布局。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

文件 Asset 缺少格式识别和必要的文件信息层级，导致大面积空白；当前图标也不是用户指定的视觉资产。

## 现象

- guide.md 仅显示一个居中的灰色通用图标。
- 文件卡片没有文件名与轻量副信息。
- PDF、MD、PPT、CSV、XLS、DOC、代码没有使用用户提供的对应 SVG。

## 复现方式

1. 打开包含 guide.md 文件 Asset 的 Page。
2. 观察文件节点主体。
3. 对比用户提供的横排文件项参考图。

## 影响范围

所有非图片、非视频文件 Asset。

## 证据

- 用户当前截图与布局参考图。
- 用户提供 8 个格式 SVG 文件。
- 当前实现只渲染 80px 通用 Icon，且主体没有文本。

## 初步归因

上一轮为去除文件节点嵌套灰卡和多余元数据时，连同格式资产与必要的信息层级一起移除了。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何使用用户 SVG 建立明确且有 unknown fallback 的格式映射？
- 如何在保留角色、More 和连接交互的前提下实现单层白底横排文件卡片？

## 相关文件

- `plugins/canvasight/src/assets/icons`
- `plugins/canvasight/src/lib/assetPresentation.ts`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/styles/app.css`

## 期望结果

文件 Asset 使用用户提供的对应格式 SVG；未映射格式统一使用 unknown；主体采用图标、文件名和轻量副信息的横排布局，16px 内容 padding 对齐纯文字节点，图片/视频不变。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已使用用户提供的八个 SVG 完成格式映射、未知格式回退和单层横排文件卡片；真实浏览器验收通过。

## 修改文件

- `plugins/canvasight/src/assets/icons/icon/file-format-*.svg`
- `plugins/canvasight/src/lib/assetPresentation.ts`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/*`
- `README.md`
- `design.md`
- `design-qa.md`

## 验证方式

- `npm run test:asset-presentation`
- `npm run build`
- `npm run check:mcp-bundle`
- plugin validation
- 真实浏览器文件卡片、未知回退、图片/视频、More、Handle/Edge 几何与控制台验收

## 后续风险

真实 Codex native Widget 未执行 exact-version host acceptance；本轮 browser/dev 证据不能替代该门禁。后续不得重新引入灰色内层容器，也不得影响图片和视频的内容本体展示。
