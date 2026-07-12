---
schema_version: 1
report_id: issue-native-widget-attachment-relative-url
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 2
agent_id: /root/development_agent
thread_id: 019f567f-454e-75a3-ac0e-b7c6e4cd8ab3
created_at: 2026-07-12T13:25:20Z
updated_at: 2026-07-12T13:30:23Z
depends_on: []
related_files:
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/components/TaskNode.tsx
verification_status: failed
verification_evidence:
  - implementation checks and browser-visible image loading passed
  - exact installed plugin version is 0.4.2+codex.20260712132520
  - real restarted Codex fullscreen native Widget acceptance is not available in this task
solution_report: agent-reports/resolved/solution-native-widget-attachment-relative-url.md
---

# 原生 Widget 附件图片相对地址导致破图

## TL;DR

粘贴图片保存成功，但附件的相对 `fileUrl` 在原生 Widget 中解析到了 Widget 资源域，缩略图无法加载。

## 问题描述

Canvasight daemon 返回 `/api/asset?...` 形式的附件地址。浏览器开发页与 daemon 同源，原生 Widget 则直接托管构建产物；`img` 使用相对地址时会请求错误的宿主资源域。

## 现象与复现

1. 在任务节点中粘贴剪贴板图片。
2. 附件 chip 出现，文件名可见。
3. 缩略图显示破图图标。

## 影响范围

- 原生 Widget 中新粘贴、上传、拖入以及从文档恢复的图片附件缩略图。
- 浏览器开发页通常不受影响，因此容易漏过。

## 证据

- `assetUrlForPath` 返回相对 `/api/asset` 地址。
- `TaskNode` 将 `attachment.fileUrl` 原样传给 `<img src>`。
- 用户截图显示附件元数据已渲染但图片请求失败。

## 期望结果

客户端根据 Canvasight runtime 的 daemon origin 解析附件资源地址，浏览器页和原生 Widget 均能显示图片，同时不改变持久化附件数据。

## Closure Criteria

- [ ] 相对资源地址在原生 Widget 中解析到 daemon origin
- [ ] 浏览器开发页行为保持不变
- [ ] 类型检查和构建通过
- [ ] 浏览器可见缩略图验证通过
- [ ] 原生宿主验收证据或明确未验证风险已记录

## 处理结果

实现已完成，见 `solution-native-widget-attachment-relative-url`。由于当前 Codex Desktop 尚未重启，无法证明新版本在真实 fullscreen native Widget 中完成实例绑定的图片粘贴与重载；按原生验收规则保持 assigned。

## 修改文件

- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/components/ui/upload-chip.tsx`
- 插件版本与构建产物

## 验证方式

- typecheck、build、widget runtime smoke、MCP smoke
- 浏览器真实上传用户提供的 PNG，`naturalWidth=584`、`naturalHeight=188`

## 后续风险

- 需要重启 Codex Desktop，在新任务中通过 `open_canvasight` 与 `await_canvasight_widget_ready` 后完成真实 native Widget 图片验收。
