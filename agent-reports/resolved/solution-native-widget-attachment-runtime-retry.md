---
schema_version: 1
report_id: solution-native-widget-attachment-runtime-retry
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f5be0-bbca-7821-adec-8617aad1bb05
created_at: 2026-07-13T14:38:23Z
updated_at: 2026-07-13T14:38:23Z
depends_on:
  - issue-native-widget-attachment-relative-url
related_files:
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/components/ui/upload-chip.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - design.md
verification_status: passed
verification_evidence:
  - isolated npm run typecheck passed
  - isolated Vite production build passed
  - isolated complete npm run test:widget-runtime passed
  - late same-binding metadata test replaced the failed placeholder with a loaded image
---

# 原生 Widget 图片缩略图 runtime 重试方案

## 处理结果

- `TaskNode` 使用 reactive runtime snapshot 订阅 `canvasight:widget-data`，同一 binding 的 `apiBaseUrl` 变化也会重新渲染附件 URL。
- `resolveCanvasightAssetUrl` 支持显式 snapshot base，保证 React 渲染使用一致输入。
- `UploadChip` 按失败的具体 URL 记录状态；地址从错误 origin 更新为正确 origin 后自动再次渲染 `<img>`。
- 绿点渐变伪缩略图已删除，真实失败时显示中性 warning 图标，不再让占位看起来像图片内容。
- `design.md` 固化真实缩略图与中性、可恢复失败态规则。

## 验证

组合 Widget 回归先以不可用 origin 渲染相对图片并确认失败态，再通过 MCP Apps 的真实 `ui/notifications/tool-result` 路径发送同 binding 的正确 metadata。最终断言 `<img>` 地址更新、`naturalWidth` 与 `naturalHeight` 大于零，并且完整 composed Widget smoke 通过。

## 后续风险

该验证使用真实 Chromium 和组合 Widget 宿主，但不是 Codex Desktop fullscreen native host。安装交付版本并重启 Desktop 后，仍需完成图片粘贴、项目重载、画布控制与同任务 Run 的原生验收。
