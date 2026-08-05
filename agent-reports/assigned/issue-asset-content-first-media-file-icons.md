---
schema_version: 1
report_id: issue-asset-content-first-media-file-icons
report_type: issue
status: blocked
owner: Test Supervisor Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-08-05T03:02:17Z
updated_at: 2026-08-05T03:36:00Z
depends_on: []
related_files:
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/assets
  - plugins/canvasight/src/lib/translations.ts
  - design.md
  - README.md
verification_status: failed
verification_evidence:
  - Canvasight 0.5.2 local automation and browser-visible image/file/video workflow passed
  - Exact restarted Codex Desktop native-host acceptance was not available
solution_report: agent-reports/resolved/solution-asset-content-first-media-file-icons.md
---

# Asset 内容本体与统一文件图标仍不符合预期

## TL;DR

图片、视频和文件仍被包在多层卡片中，并显示用户不关心的文件名与尺寸；分类和更多操作的显隐层级也与“内容即节点”语义相反。

## 问题描述

当前图片 Asset 外层还有白色节点壳、灰色预览底和底部元数据，文件 Asset 也表现为白壳套灰卡。用户要求媒体内容直接成为节点本体，文件为单层纯白对象；分类下拉默认显示在左上角，更多操作仅在悬停或键盘聚焦时显示，文件名和尺寸完全隐藏。用户取消 Image 生成，要求复用此前已经提供并进入仓库的统一 SVG 图标体系完成常见格式映射。

## 影响范围

- 图片、视频和普通文件 Asset 的结构、尺寸、背景、圆角与连接点。
- 分类入口、更多菜单的默认与悬停/聚焦显隐。
- 常见扩展名/MIME 分类与文件图标资产。
- 双语 README、`design.md`、构建分发与浏览器可见验证。

## 已确认边界

- 图片与视频内容直接构成 Asset，不再显示外壳、文件名或尺寸。
- 文件只保留单层白底对象与大图标，不显示灰色内卡、文件名或尺寸。
- 左上角常驻分类下拉，当前值可见且可直接切换。
- 右上角更多菜单默认隐藏，仅 hover/focus/selected 时显示。
- 更多菜单只包含更换和删除；分类仅在左上角外显下拉中提供；左右连接点保留。
- 常见文件格式映射到仓库现有统一 SVG 图标体系，未知格式安全回退到通用文件图标。
- 不修改 `.scatter` v2 字段、资产托管或 Graph Writer 合同。

## Closure Criteria

- [x] 图片/视频只显示媒体本体，无外层卡片和元数据
- [x] 文件只显示单层白底与统一图标，无文件名和尺寸
- [x] 分类常驻左上角且可直接下拉选择
- [x] 更多操作仅 hover/focus/selected 时显示
- [x] 常见格式有完整映射与通用回退
- [x] 只复用仓库现有 SVG 图标，不引入生成位图
- [x] 自动化、浏览器可见验证、README 与 design.md 同步完成
- [ ] 精确 0.5.2 的真实 Codex native-host 验收通过

## 当前状态

blocked

## 处理结果

已停止并放弃 Image 生成结果；本地实现、设计审查、完整自动化和图片/文件/真实视频浏览器验证均已通过，解决方案见 `agent-reports/resolved/solution-asset-content-first-media-file-icons.md`。由于本轮不能安装精确 0.5.2 并重启 Codex Desktop 完成真实 fullscreen Widget 验收，本 issue 转交 Test Supervisor Agent 并保持 blocked。

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

- 自动化、插件验证与 release gate 全部通过。
- Playwright 验证图片自然比例、文件单层白底、分类与 More、左右连接、拖动和真实视频播放/seek，控制台零错误/警告。
- 页面实际视频 Range 请求返回 `206 video/mp4`、`Accept-Ranges: bytes` 与正确 `Content-Range`。

## 后续风险

- 真实 Codex native-host 验收必须独立于浏览器可见验证，不能以 dev fixture 代替；当前状态为 `unverified`。
