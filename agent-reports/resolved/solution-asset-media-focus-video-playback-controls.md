---
schema_version: 1
report_id: solution-asset-media-focus-video-playback-controls
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: medium
version: 2
agent_id: /root/development_agent
thread_id: null
created_at: 2026-08-06T04:13:46Z
updated_at: 2026-08-06T13:44:18Z
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

# 媒体 Asset 聚焦边框与原生视频控制栏

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-asset-media-focus-video-playback-controls.md`

## Root Cause

内容优先的图片/视频 Asset 移除了外壳与 border，却只保留 hover shadow，没有独立选中边界。浏览器原生播放器会把画面点击解释为播放/暂停，但用户同时要求保留完整原生底栏，因此需要把画面选择命中区与底部 controls 命中区分离。

## 调研过程

- 用户验收明确否决自定义播放按钮，要求恢复此前的原生进度、时间、音量与全屏工具栏。
- focused smoke 固化 `video[controls]`、无 custom toolbar、focus-token overlay、picture-only selection layer 与几何边界。
- Chromium browser QA 对 selection layer 的最后 1px 和原生 controls 的第 1px 分别探针，确认无覆盖、无空隙。

## 可选方案

- 给媒体节点增加布局 border：会改变 bounds 与 Edge 端点，不采用。
- 移除 native controls 并使用自定义 play/pause：丢失进度、时间、音量和全屏，用户已否决。
- 在内容内部叠加 border，并让透明 selection layer 只覆盖画面、为原生底栏保留安全区：采用。

## 推荐方案

图片/视频的 selected 状态通过 absolute `::after` 绘制 1px `--color-border-focus` border。Video 保留无裁剪限制的 `controls`；透明 sibling selection layer 覆盖上方 172px 画面并自然冒泡给 XYFlow，底部 48px 完整透传给浏览器原生 controls。全局 Space-pan 跳过 `video[controls]` 和 `audio[controls]`。

## 实施步骤

1. 保留媒体 selected overlay，不改变 node/content/video 尺寸。
2. 恢复 `<video controls>` 并删除 custom toolbar、播放状态、命令及翻译。
3. 添加 picture-only selection layer，准确避开底部 48px 原生 controls。
4. 让 Space-pan 跳过原生受控媒体，并加入 focused contracts。

## 风险与回滚

回滚 selection layer 会重新引入画面点击切换播放；增大 safe area 可能在不同浏览器留下画面误触区域。未增加持久字段或 runtime contract，Safari 的 UA controls 仍需单独实测。

## 处理结果

已纠正。图片/视频选中边框、画面选择、原生 Play/Pause、seek、fullscreen、More 和几何稳定均通过 Chromium 浏览器验证。

## 修改文件

- 见 frontmatter `related_files`。

## 验证方式

- `npm run test:asset-presentation`
- `npm run typecheck`
- 双主题 real-browser pointer/native-controls/playback/computed-style/geometry/console matrix

## 后续风险

Safari UA controls safe area 与真实 Codex native widget 验收由 assigned issue 继续跟踪；浏览器证据不能替代 native-host acceptance。
