---
schema_version: 1
report_id: solution-asset-media-focus-video-playback-controls
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: medium
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-08-06T04:13:46Z
updated_at: 2026-08-06T04:13:46Z
depends_on:
  - issue-asset-media-focus-video-playback-controls
related_issue: agent-reports/assigned/issue-asset-media-focus-video-playback-controls.md
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
verification_status: passed
verification_evidence:
  - npm run test:asset-presentation
  - npm run typecheck
  - 双主题真实浏览器媒体交互与几何回归矩阵；console 0/0
---

# 媒体 Asset 聚焦边框与显式视频播放工具栏

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-asset-media-focus-video-playback-controls.md`

## Root Cause

内容优先的图片/视频 Asset 移除了外壳与 border，却只保留 hover shadow，没有独立选中边界。视频继续使用 native controls，浏览器将画面点击解释为播放/暂停；同时 Canvasight 全局 Space-pan 快捷键会阻止 focused button 的原生 Space 激活。

## 调研过程

- 真实浏览器确认旧 video surface 点击会同时选中并切换 paused。
- 先用 focused smoke 固化无原生 controls、focus-token overlay、命名 toolbar、事件驱动状态与几何边界。
- Browser QA 发现 ended 视频不能重播及 Space 被全局 handler 阻断，分别完成红绿修复。

## 可选方案

- 给媒体节点增加布局 border：会改变 bounds 与 Edge 端点，不采用。
- 继续使用 native controls 并阻止 picture click：跨浏览器 shadow controls 行为不稳定，不采用。
- 在内容内部叠加 border，并使用自定义底部 play/pause toolbar：采用。

## 推荐方案

图片/视频的 selected 状态通过 absolute `::after` 绘制 1px `--color-border-focus` border。Video 移除 `controls`，画面 click 仅 prevent default 并冒泡给 XYFlow；底部常驻命名 toolbar 的原生 IconButton 执行 play/pause，状态由 play/pause/ended 事件更新。全局 Space-pan 跳过 native/ARIA 交互控件，ended 视频播放前先归零。

## 实施步骤

1. 添加媒体 selected overlay 与工具栏层级，不改变 node/content/video 尺寸。
2. 引入本地化 toolbar/play/pause 名称和既有 SVG 图标。
3. 分离视频选择与播放事件，处理 rejected play 与 ended replay。
4. 修复 Space-pan 与 button 原生键盘激活冲突并加入 focused contracts。

## 风险与回滚

回滚可移除 toolbar、overlay 和 keyboard-interactive guard，恢复 native controls；但会重新引入用户报告的选择/播放冲突。未增加持久字段或 runtime contract。

## 处理结果

已修复。图片/视频选中边框、视频画面选择、底部播放控制、Space/Enter、ended replay 与几何稳定均通过浏览器验证。

## 修改文件

- 见 frontmatter `related_files`。

## 验证方式

- `npm run test:asset-presentation`
- `npm run typecheck`
- 双主题 real-browser pointer/keyboard/playback/computed-style/geometry/console matrix

## 后续风险

真实 Codex native widget 验收由 assigned issue 继续跟踪；浏览器证据不能替代 native-host acceptance。
