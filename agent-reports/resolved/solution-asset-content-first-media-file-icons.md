---
schema_version: 1
report_id: solution-asset-content-first-media-file-icons
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-08-05T03:36:00Z
updated_at: 2026-08-05T03:36:00Z
depends_on:
  - issue-asset-content-first-media-file-icons
related_files:
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/lib/assetPresentation.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - README.md
  - design.md
verification_status: passed
verification_evidence:
  - Canvasight 0.5.2 automation and release gates passed
  - Playwright image, file, and real-video workflow passed with zero console errors or warnings
---

# Asset 内容本体与现有 SVG 文件图标方案

## 负责 Agent

Development Agent 负责 UI、格式映射和视频资源服务，Design Agent 与 Test Supervisor Agent 负责独立审查，Main Thread 负责集成。

## 对应问题

`agent-reports/assigned/issue-asset-content-first-media-file-icons.md`

## Root Cause

Asset 沿用了“节点壳 + 内容卡 + 元数据”的多层结构，导致媒体不像画布上的直接内容；普通文件又叠加了灰色内卡。分类入口和 More 的层级也相反。原有开发资源服务只识别图片并始终返回完整 200 响应，使视频虽可小文件播放，却缺少正确 MIME 与 Range/seek 合同。

## 推荐方案

让图片和视频本体直接成为 360px Asset，普通文件只使用单层白色表面和仓库已有 SVG registry 图标。左上分类下拉常驻，右上 More 默认隐藏并只保留更换和删除。以扩展名/MIME 映射常见格式，未知类型回退到通用现有 SVG；daemon 与 Vite 开发资源服务同时支持视频 MIME、单 Range 206 和无效 Range 416。

## 实施步骤

1. 重构 Asset JSX/CSS，移除可见文件名、尺寸、外壳、灰色预览井和重复分类菜单。
2. 新增独立格式映射模块，复用已有 SVG registry 覆盖文档、数据、演示、归档、媒体、代码、字体、3D、安装包、电子书和设计文件。
3. 增加直接视频节点和原生 controls，不自动播放；保留左右连接、拖动与无障碍名称。
4. 为 daemon 与 Vite 开发资源服务增加视频 MIME、`Accept-Ranges`、206/416 处理，并增加 MCP、开发服务器和展示合同测试。
5. 同步双语 README、`design.md`、`AGENTS.md`、0.5.2 版本与生成分发快照。

## 风险与回滚

没有新增持久化字段，也未删除受管文件。回滚 UI 和资源服务不会改变 `.scatter` v2 文档；生成的 Image 草稿未进入仓库、源码或分发产物。

## 处理结果

本地实现、设计审查、自动化矩阵和浏览器真实视频流程均已通过。

## 修改文件

- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/lib/assetPresentation.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `README.md`、`design.md`、`AGENTS.md`
- Canvasight 0.5.2 版本字段、自包含 MCP bundle 与 Web 分发快照

## 验证方式

- 通过 typecheck、build、MCP bundle、MCP、dev-server、并发、Widget runtime、插件分发、release 和 plugin validation。
- Playwright 通过图片自然比例、普通文件单层白底、分类/More、左右连线、拖动与真实 MP4 播放/seek；控制台 0 errors、0 warnings。
- 页面实际 `<video>.src` Range 请求返回 `206 video/mp4`、`Accept-Ranges: bytes`、正确 `Content-Range` 与准确响应长度。

## 后续风险

真实 Codex native-host 仍为 `unverified`，由对应 issue 保持 blocked 并交 Test Supervisor Agent 跟进。
