---
schema_version: 1
report_id: issue-native-widget-attachment-relative-url
report_type: issue
status: assigned
owner: Development Agent
created_by: Main Thread
priority: high
version: 5
agent_id: /root/development_agent
thread_id: 019f5be0-bbca-7821-adec-8617aad1bb05
created_at: 2026-07-12T13:25:20Z
updated_at: 2026-07-14T02:33:45Z
depends_on: []
related_files:
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/components/TaskNode.tsx
verification_status: failed
verification_evidence:
  - isolated 0.4.16 MCP and composed Widget regression suites pass through the new session-scoped attachment preview proxy
  - user screenshot on 2026-07-14 from installed 0.4.15 proves the neutral failure icon still appears in the native surface
  - the saved PNG is valid and the authenticated daemon asset request returns 200 image/png with matching bytes
  - composed widget tests did not model the native host blocking the direct localhost image request
  - real restarted Codex fullscreen native Widget acceptance is not available in this task
solution_report: agent-reports/resolved/solution-native-widget-attachment-proxy-preview.md
---

# 原生 Widget 附件图片相对地址导致破图

## TL;DR

粘贴图片保存成功且 daemon 可读取文件，但原生 Widget 直接加载 localhost 图片资源仍失败，缩略图无法显示。

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
- 2026-07-14 的 0.4.15 截图显示中性 warning fallback，证明重试与失败态代码已运行，但真实 native-host 资源传输仍失败。
- 当前项目 PNG 为有效的 961×816 图片；使用当前 daemon origin、path 与 token 直接请求得到 `200 image/png`、48717 bytes，排除文件损坏与 daemon 鉴权失败。
- 原生 Widget 的 JSON API 已通过 app-only `canvasight_widget_api` 代理，但 `<img>` 仍直接访问 localhost；现有 composed smoke 没有复现真实宿主对这条资源请求的限制。

## 期望结果

客户端根据 Canvasight runtime 的 daemon origin 解析附件资源地址，浏览器页和原生 Widget 均能显示图片，同时不改变持久化附件数据。

## Closure Criteria

- [x] 相对资源地址会随同一 binding 的 runtime metadata 更新重新解析
- [x] 图片失败状态按具体 URL 记录，资源地址修正后自动重试
- [x] 失败态使用明确的中性图标，不再伪装成图片缩略图
- [x] 隔离 typecheck、构建和完整 composed Widget smoke 通过
- [x] 原生 Widget 通过 app-only MCP proxy 获取附件字节，不再依赖直接 localhost `<img>` 请求
- [x] 浏览器/dev 继续使用现有 daemon 资源 URL，持久化附件合同不变
- [x] 原生宿主验收证据或明确未验证风险已记录

## 处理结果

app-only MCP 代理附件字节方案已完成，见 `solution-native-widget-attachment-proxy-preview`。0.4.16 自动化构建与代理链路验证通过；真实 Codex fullscreen native-host 尚未重启验收，因此 issue 保持 assigned。

## 修改文件

- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/components/ui/upload-chip.tsx`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`

## 验证方式

- 基于 baseline HEAD 的隔离 0.4.16 `npm run typecheck`、production build、`npm run test:mcp` 与 `npm run test:widget-runtime`
- MCP 回归验证真实图片字节、非图片 415、跨项目路径 403、超限 413
- composed Widget 回归验证两张不同图片分别通过 `canvasight_widget_api` 取得 data URL，且不传出 daemon token 或直接 `/api/asset` tool path

## 后续风险

- 需要重启 Codex Desktop，在新任务中通过 `open_canvasight` 与 `await_canvasight_widget_ready` 后完成真实 native Widget 图片验收。
