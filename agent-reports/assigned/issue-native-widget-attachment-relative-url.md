---
schema_version: 1
report_id: issue-native-widget-attachment-relative-url
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/development_agent
thread_id: 019f5be0-bbca-7821-adec-8617aad1bb05
created_at: 2026-07-12T13:25:20Z
updated_at: 2026-07-13T14:38:23Z
depends_on: []
related_files:
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/components/TaskNode.tsx
verification_status: failed
verification_evidence:
  - user screenshot on 2026-07-13 proves the faux thumbnail fallback still appeared in the native surface
  - isolated typecheck, Vite build, and complete composed widget smoke pass with same-binding runtime retry coverage
  - real restarted Codex fullscreen native Widget acceptance is not available in this task
solution_report: agent-reports/resolved/solution-native-widget-attachment-runtime-retry.md
---

# 原生 Widget 附件图片相对地址导致破图

## TL;DR

粘贴图片保存成功，但附件的相对 `fileUrl` 在原生 Widget 中解析到了 Widget 资源域，缩略图无法加载。

## 问题描述

Canvasight daemon 返回 `/api/asset?...` 形式的附件地址。浏览器开发页与 daemon 同源，原生 Widget 则直接托管构建产物；`img` 使用相对地址时会请求错误的宿主资源域。

## 现象与复现

1. 在任务节点中粘贴剪贴板图片。
2. 附件 chip 出现，文件名可见。
3. 缩略图显示破图图标或绿点渐变的伪图片占位。

## 影响范围

- 原生 Widget 中新粘贴、上传、拖入以及从文档恢复的图片附件缩略图。
- 浏览器开发页通常不受影响，因此容易漏过。

## 证据

- `assetUrlForPath` 返回相对 `/api/asset` 地址。
- `TaskNode` 将 `attachment.fileUrl` 原样传给 `<img src>`。
- 用户截图显示附件元数据已渲染但图片请求失败。
- 2026-07-13 用户再次提供截图，确认旧修复后仍显示 `.kit-upload-chip-thumbnail-empty` 的伪缩略图。
- 同一 binding 的 `canvasight:widget-data` 到达后没有触发任务节点重新渲染，首次失败的图片地址被 `imageFailed` 状态锁死。

## 期望结果

客户端根据 Canvasight runtime 的 daemon origin 解析附件资源地址，浏览器页和原生 Widget 均能显示图片，同时不改变持久化附件数据。

## Closure Criteria

- [x] 相对资源地址会随同一 binding 的 runtime metadata 更新重新解析
- [x] 图片失败状态按具体 URL 记录，资源地址修正后自动重试
- [x] 失败态使用明确的中性图标，不再伪装成图片缩略图
- [x] 隔离 typecheck、构建和完整 composed Widget smoke 通过
- [ ] 原生宿主验收证据或明确未验证风险已记录

## 处理结果

补充修复已完成，见 `solution-native-widget-attachment-runtime-retry`。任务节点现在订阅同一 binding 的 runtime metadata，资源 base 更新会重新计算图片地址；失败状态只绑定旧 URL，因此正确地址到达后会恢复真实 `<img>`。由于尚缺真实 fullscreen native Widget 粘贴与重载证据，issue 按原生验收规则保持 assigned。

## 修改文件

- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/components/ui/upload-chip.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `design.md`

## 验证方式

- 基于 baseline HEAD 的隔离 `npm run typecheck`、Vite production build、完整 `npm run test:widget-runtime`
- 回归先让相对图片请求失败，再通过真实 `ui/notifications/tool-result` 路径发送同 binding 的正确 base，验证占位消失且 `<img>` 为 `naturalWidth=1`、`naturalHeight=1`

## 后续风险

- 需要重启 Codex Desktop，在新任务中通过 `open_canvasight` 与 `await_canvasight_widget_ready` 后完成真实 native Widget 图片验收。
