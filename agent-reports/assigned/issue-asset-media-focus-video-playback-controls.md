---
schema_version: 1
report_id: issue-asset-media-focus-video-playback-controls
report_type: issue
status: assigned
owner: Test Supervisor Agent
created_by: Main Thread
priority: medium
version: 4
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-08-06T03:49:52Z
updated_at: 2026-08-06T13:44:18Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
  - design.md
  - README.md
verification_status: failed
verification_evidence:
  - 用户验收否决自定义播放工具栏；正确合同是保留原生完整底部 controls，同时让画面点击只选择节点。
  - Chromium browser QA 通过完整原生 controls、48px safe area 边界、画面选择、播放/暂停、seek、fullscreen、双主题 focus ring 与稳定 Edge 几何；console 0/0。
  - 真实 Codex native widget 尚未验收，因此按项目合同保持 failed/assigned，不以 browser 证据关闭。
solution_report: agent-reports/resolved/solution-asset-media-focus-video-playback-controls.md
---

# 图片/视频 Asset 缺少选中边框且视频画面点击误触播放

## TL;DR

图片和视频 Asset 被选中后没有聚焦色边框；视频画面单击还会直接切换播放状态，破坏画布节点的统一选中交互。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

媒体内容本体作为 Asset Node 边界时仍需明确选中反馈。图片和视频点击应先完成画布节点选中，选中态使用现有 focus border token，且不得因边框改变节点尺寸、Handle 或 Edge 端点。视频画面点击只负责选中；浏览器原生底部 controls 必须完整保留，包括进度、时间、播放/暂停、音量与全屏。

## 现象

- 图片/视频 `selected` 状态只有 hover shadow，没有聚焦色边框。
- 自定义 video toolbar 错误移除了原生进度、时间、音量与全屏控制。

## 复现方式

1. 在画布中创建图片 Asset 和视频 Asset。
2. 单击图片或视频内容，观察选中态。
3. 单击视频画面，观察视频播放状态。

## 影响范围

图片/视频 Asset 的选择反馈、视频播放控制、键盘可访问性，以及媒体节点与 Handle/Edge 的几何稳定性。

## 证据

- 用户截图显示媒体节点被选中时缺少聚焦边框。
- 当前图片/视频 CSS 显式 `border: 0`，选中态只提升 shadow。
- 当前 video 使用浏览器原生 `controls`，画面点击行为由原生播放器接管。

## 初步归因

媒体内容优先改造移除了外层边框，但未补充不占布局的选中边界；原生播放器的画面点击语义与 XYFlow 节点选择冲突。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何提供真实 border 视觉而不改变节点几何与 Edge 端点？
- 如何将视频画面选择与播放控制可靠分离，同时保留键盘操作？

## 相关文件

- 见 frontmatter `related_files`。

## 期望结果

图片/视频点击后显示 `--color-border-focus` 选中边框且节点几何不变；视频画面单击只选中节点，底部浏览器原生完整 controls 保持可见且可操作。

## Closure Criteria

- [x] 图片与视频选中态显示 focus token 边框
- [x] 边框不改变节点尺寸、Handle 或 Edge 端点
- [x] 视频画面点击只选中且不播放/暂停
- [x] 恢复浏览器原生完整底部 controls，包括进度、时间、播放/暂停、音量与全屏
- [x] 图片、视频、文件与 More/连接控件无回归
- [x] focused tests、typecheck、build 与双主题 browser QA 通过
- [ ] 真实 Codex native widget 验收状态被明确记录

## 当前状态

assigned：纠正后的源码、构建和 Chromium browser QA 已通过；交给 Test Supervisor Agent 等待真实 Codex native widget 验收。

## 处理结果

媒体 focus border 保留；视频已恢复原生完整 controls，48px picture/control 边界通过实测。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `design.md`、`README.md` 与 Vite production artifacts

## 验证方式

- `npm run test:asset-presentation`
- `npm run typecheck`
- `npm run build`
- `npm run test:widget-runtime`
- 双主题 real-browser interaction/computed-style/geometry/console QA

## 后续风险

必须验证 selection overlay 不覆盖原生底部 controls，且原生进度、时间、音量、全屏与键盘操作仍可用。
