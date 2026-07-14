---
schema_version: 1
report_id: solution-native-widget-attachment-proxy-preview
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f5be0-bbca-7821-adec-8617aad1bb05
created_at: 2026-07-14T02:33:45Z
updated_at: 2026-07-14T02:33:45Z
depends_on:
  - issue-native-widget-attachment-relative-url
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/components/ui/upload-chip.tsx
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - isolated 0.4.16 typecheck and production build passed
  - isolated MCP smoke passed including attachment preview proxy security assertions
  - isolated composed production Widget smoke passed with two distinct proxied images
  - clean plugin distribution, MCP bundle freshness, release verification, and plugin validation passed
---

# 原生 Widget 附件图片代理预览方案

## Root Cause

图片文件与 daemon 资源接口均正常，但 Codex 原生 Widget 沙箱不能可靠地让 `<img>` 直接消费 localhost daemon 地址。0.4.15 只修正 URL 与重试状态，没有改变错误的资源传输路径。

## 推荐方案

原生 Widget 通过 app-only `canvasight_widget_api` 请求会话限定的 `attachment-preview` JSON 接口，取得经过校验的图片字节并渲染为 data URL；browser/dev 继续使用原有 daemon 资源 URL。

## 处理结果

- 新增会话级附件预览接口，仅允许当前项目 `.scatter/assets` 或模板资源目录中的普通非符号链接文件。
- 使用 `realpath` 约束目录边界，只接受图片 MIME，限制为 10 MiB。
- 每个附件独立异步加载，loading 使用中性空状态，真实失败后才显示 warning。
- 两图片回归验证不同路径得到不同 data URL，且 Widget tool call 不泄露 daemon token 或直接 `/api/asset` 地址。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/components/ui/upload-chip.tsx`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:widget-runtime`
- `npm run check:mcp-bundle`
- `npm run test:plugin-distribution`
- `npm run release:verify -- 0.4.16`
- plugin validator

## 后续风险

自动化链路已通过，但 Codex Desktop 必须加载 0.4.16 后在新任务完成 fullscreen ready、两张真实图片、重载、画布控制、同任务 Run 与 late metadata 验收；在此之前父 issue 保持 assigned。
