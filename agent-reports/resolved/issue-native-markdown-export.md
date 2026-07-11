---
schema_version: 1
report_id: issue-native-markdown-export
report_type: issue
status: resolved
owner: Main Thread
created_by: Main Thread
priority: high
version: 1
agent_id: /root
thread_id: null
created_at: 2026-07-11T11:45:00Z
updated_at: 2026-07-11T11:45:00Z
depends_on: []
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/components/RightDrawer.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
verification_status: passed
verification_evidence:
  - npm run test:markdown-export
  - npm run test:markdown
  - npm run typecheck
  - npm run build
  - plugin validation
solution_report: solution-native-markdown-export
---

# Native widget 浏览器下载无响应

## 处理结果

浏览器 Blob 下载改为 daemon 写入 `~/Downloads`，导出成功后在 Finder 中定位文件。附件 ZIP 和纯 Markdown 都不再依赖 widget 的 `<a download>` 行为。

## 后续风险

完整 MCP smoke 被既有的 `diagnostics.nativeWidget` 前置断言阻断；真实 native widget 点击仍需重启 Codex 后手工验收。
