---
status: resolved
report_type: solution
version: 2
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-08-05 21:03
updated_at: 2026-08-05 21:18
related_issue: agent-reports/resolved/20260805-2055-issue-svg-asset-first-class-support.md
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/tests/svg-asset-smoke.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
---

# SVG Asset 一等分类与被动安全预览

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260805-2055-issue-svg-asset-first-class-support.md`

## Root Cause

上传链路已经把标准 `.svg` 放入 image extension 集合，但文档读取时的 `normalizeAttachment` 只相信持久化 `kind`，使 legacy 或 AI-authored `kind:file` SVG 永久落入普通文件卡。同时 browser/dev 与 native widget 的 SVG 预览缺少显式 sanitizer、direct asset 响应安全头和 SVG 专项自动化，安全性只依赖当前 `<img>` 的浏览器语义；Vite dev `/api/asset` 又独立手写 200/206 headers，未继承 daemon 的 nosniff/sandbox policy。

## 调研过程

先建立 `npm run test:svg-asset` 最小反馈环。修复前稳定得到 `legacy or AI-authored managed SVG assets must normalize to first-class images`，实际 `file`、期望 `image`。随后逐层审计上传 MIME、受管路径、文档 normalize、AI managed asset reuse、`/api/asset`、native `attachment-preview`、widget API allowlist/CSP、`loadCanvasightImageAsset`、AssetNode `<img>`、Open/Replace 与现有测试。浏览器基线证明 raw SVG 在 `<img>` 中当前保持 inert，但这不足以代替长期安全合同。

## 可选方案

- 方案 A：继续依赖 `<img>` 原生隔离，只修复 `kind`。能修显示，但无法锁定 future renderer、外部引用和顶层 asset 导航的安全边界。
- 方案 B：服务端改写或覆盖用户 SVG 源文件。会破坏 Asset 原件和 Open/Run 语义，不可接受。
- 方案 C：受管存储扩展名决定 SVG 身份，源文件保持字节不变；所有 SVG preview 在进入 `<img>` 前经过 detached-DOM 清洗，direct asset 增加 nosniff/sandbox，native 继续走严格代理。采用。

## 推荐方案

采用方案 C。`.svg` managed path 是唯一 SVG 权威：空 MIME、octet-stream 或 SVG MIME 均规范为 `image/svg+xml`；非 `.svg` 伪报 SVG MIME fail closed。其他 raster image MIME 保持原有兼容。原始 SVG 不被改写，只有 preview 派生数据被清洗。

## 实施步骤

1. 统一 `normalizedAttachmentMime`、`attachmentKind` 与 `normalizeAttachment`，以实际 `storedPath`/`relativePath` 扩展优先，修复 legacy 与 AI managed SVG 分类，并阻止 originalName/MIME 欺骗。
2. 在 `loadCanvasightImageAsset` 增加 SVG 专用 detached-DOM sanitizer：移除 script、事件属性、foreignObject、活动嵌入元素、外链 href、外部 CSS URL 与可在清洗后动态改写引用的 SMIL animate/set，同时保留 viewBox、gradient、内部 fragment URL 与安全 style。
3. browser/dev 通过受管 asset URL 拉取后清洗；native widget 通过 `attachment-preview` 获取 bytes 后清洗；managed data/blob shortcut 进入同一 sanitizer，不能提前返回 raw SVG。
4. AssetNode 继续只以 `<img>` 呈现 Image Asset，不引入 inline SVG、`dangerouslySetInnerHTML`、object、embed 或 iframe；Open/Replace 仍操作原始受管文件。
5. `/api/asset` 为 SVG 增加 `X-Content-Type-Options: nosniff` 与 sandbox CSP；保持项目路径、regular-file/symlink、代理 allowlist、10MB native preview 限制和 widget CSP 不扩宽。
6. 新增 focused、MCP 和 composed widget 回归，版本同步为 `0.5.4` 并重建 self-contained MCP 与 web snapshot。
7. 为 Vite dev asset handler 增加与 daemon 一致的共享 header helper：所有 200/206 asset 响应带 `nosniff`，SVG 同时带 `image/svg+xml` 与限制性 sandbox CSP。

## 风险与回滚

Sanitizer 会删除依赖外部图片、外部 CSS 或 foreignObject 的 SVG 内容，这是安全边界的预期 fail-closed 行为；原始文件仍完整保留，可通过 Open 查看。回滚可以恢复 sanitizer/分类/headers 与 0.5.4 生成物，不需要迁移 `.scatter` schema 或用户资产。

## 处理结果

已修复。受管 `.svg` 在 legacy、generic MIME、新上传与 AI reuse 中统一成为一等 Image Asset；伪装扩展、带参数 SVG MIME 或 originalName 不会被提升；browser/dev、native proxy 与 data/blob preview 都生成清洗后的 `image/svg+xml` data URL，并继续在 `<img>` 被动上下文显示。

## 修改文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/vite.config.ts`
- `plugins/canvasight/tests/svg-asset-smoke.mjs`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `plugins/canvasight/tests/dev-server-smoke.mjs`
- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/index-DoTAgbbF.js`

## 验证方式

- 红测：修复前 `npm run test:svg-asset` 稳定失败，legacy SVG normalize 为 `file`。
- Dev header 红测：修复前 `npm run test:dev-server` 稳定失败，200 asset 的 `x-content-type-options` 为 `null`。
- 绿测：`npm run test:svg-asset`
- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:asset-presentation`
- `npm run test:single-parent`
- `npm run test:dev-server`
- `npm run check:mcp-bundle`
- `node --check tests/widget-runtime-smoke.mjs`
- `node --check tests/mcp-smoke.mjs`
- `git diff --check`
- `npm run test:widget-runtime`：最终 production composed widget sanitizer、SMIL、managed data URL 与 passive `<img>` contract 通过。
- Fresh browser/dev：安全/恶意 SVG 均经透明、无文件卡的 `<img>` 显示，保持 8:3 与 3:2 比例；解码结果移除 script、事件、foreignObject、SMIL 与外链并保留 viewBox/gradient，执行标记全 false；Handle、More、Open、Replace、legacy kind/MIME 重载正常，console errors/warnings 0/0。Dev `/api/asset` 200/206 均返回 SVG MIME、`nosniff` 与 sandbox CSP。真实 native host 不在本轮已有证据内。

## 后续风险

SVG sanitizer 是 preview 派生层，不会也不应修改原始 Asset。真实 native host 未纳入本轮证据。未来若增加新的 SVG renderer 或允许额外引用协议，必须先扩展同一恶意 fixture 与 CSP/allowlist 测试；不得改用 inline markup、object/embed/iframe 或通过放宽 native CSP 绕过失败。
