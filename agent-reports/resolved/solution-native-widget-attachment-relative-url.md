---
schema_version: 1
report_id: solution-native-widget-attachment-relative-url
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f567f-454e-75a3-ac0e-b7c6e4cd8ab3
created_at: 2026-07-12T13:30:23Z
updated_at: 2026-07-12T13:30:23Z
depends_on:
  - issue-native-widget-attachment-relative-url
related_files:
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/components/ui/upload-chip.tsx
verification_status: passed
verification_evidence:
  - npm run typecheck passed
  - npm run build passed
  - npm run test:widget-runtime passed
  - npm run test:mcp passed on retry after a known concurrent daemon startup timeout
  - npm run test:markdown-export passed and preserved relativePath to assets rewrite
  - browser upload rendered the supplied PNG with naturalWidth 584 and naturalHeight 188
---

# 原生 Widget 附件图片地址解析实现方案

## 处理结果

- 新增附件资源 URL 解析器：相对 `/api/asset` 地址基于 Canvasight runtime 的 daemon origin 转为绝对地址。
- `TaskNode` 只在渲染时使用解析后地址，持久化和服务端返回结构保持不变。
- Markdown 下载继续使用 `relativePath` 重写 ZIP 内的 `assets/<name>`，不读取渲染用绝对 URL。
- `UploadChip` 捕获图片加载失败并切换到产品内空缩略图，避免显示浏览器原生破图图标。
- 同步插件版本到 `0.4.2+codex.20260712132520` 并完成本地重装。

## 设计与文档决定

- 现有 compact attachment chip 设计基线足以覆盖该修复，未更新 `design.md`。
- 用户使用方式、命令和排障流程没有变化，README 无需更新。

## 后续风险

真实 Codex fullscreen native Widget 尚未在重启后的 Desktop 宿主中完成粘贴、重载和同任务 Run 验收；相关 issue 保持 assigned。
