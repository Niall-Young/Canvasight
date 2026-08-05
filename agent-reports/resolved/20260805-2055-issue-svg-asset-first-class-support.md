---
status: resolved
report_type: issue
version: 3
owner: Development Agent
created_by: main-thread
priority: high
created_at: 2026-08-05 20:55
updated_at: 2026-08-05 21:18
related_files:
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/vite.config.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/svg-asset-smoke.mjs
  - plugins/canvasight/tests/dev-server-smoke.mjs
solution_report: agent-reports/resolved/20260805-2103-development-svg-asset-first-class-solution.md
---

# SVG Asset 一等支持与安全预览合同缺失

## TL;DR

标准新导入 SVG 当前可作为图片显示，但 legacy/generic metadata 可能被持久化为普通文件，且 raw SVG 预览缺少显式的安全清洗和长期回归门禁。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

SVG 是高频视觉资产，应像 PNG/JPEG 一样直接成为 Image Asset。无论浏览器 MIME 是否缺失、旧数据是否错误保存为 `kind:file`，受管 `.svg` 都不应落入未知文件卡；同时不得把不受信 SVG markup 注入应用 DOM 或允许脚本、事件、foreignObject、外部资源形成未来回归。

## 现象

- 新的标准 SVG 在 browser/dev 当前可以直接预览。
- `normalizeAttachment` 只相信 persisted `kind`，旧/AI-authored SVG 可继续成为普通文件。
- daemon 与 native attachment preview 返回 raw SVG bytes，安全依赖当前 `<img>` renderer，没有 sanitizer/nosniff/CSP 回归合同。

## 复现方式

1. 将受管 `.svg` 以 `kind:file` 或 generic MIME 写入 Asset metadata。
2. 打开 Page，观察它不会被统一归一为 Image Asset。
3. 使用包含 script、事件属性、foreignObject 和外链引用的 SVG；当前 `<img>` 路径虽保持 inert，但缺少自动化和响应头防回归。

## 影响范围

SVG 导入兼容、旧 `.scatter` 文档、AI graph asset reuse、browser/dev asset proxy、native widget attachment preview 与未来 renderer 安全。

## 证据

- Browser baseline：安全 SVG 360×135，保持 8:3 比例；More、Open、Replace、左右 Edge 均工作，console 0/0。
- 恶意 SVG 在当前 `<img>` renderer 中未执行，但服务器仍返回 raw bytes。
- 现有自动化没有 SVG 专项覆盖。

## 初步归因

SVG 曾被列入 image extension/MIME，但“SVG 一定归一为 Image Asset”和“只通过被动、安全的 img data preview”没有成为跨入口不变量。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何让 legacy/generic MIME SVG 稳定归一为 Image Asset？
- 如何在 browser/dev 与 native widget 中共用安全 SVG preview，不执行或内联危险 markup？
- 如何用自动化锁定 MIME、响应头、sanitizer、自然比例与控件行为？

## 相关文件

- `plugins/canvasight/mcp/server.source.mjs`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/tests/`

## 期望结果

受管 SVG 始终直接显示为无外壳的 Image Asset；保持 viewBox/自然比例、左右连接和 More；browser/dev 与 native 均通过校验代理和 `<img>` 显示，危险 markup/外部引用被移除且永不进入应用 DOM。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已完成受管 `.svg` 一等 Image Asset 分类、parameterized MIME/路径 fail-closed 规则、browser/native/data/blob 共用 preview sanitizer、SMIL 动态引用防护、daemon/Vite dev direct asset 安全响应头与 SVG 专项自动化。

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

- `npm run test:svg-asset`
- `npm run typecheck`
- `npm run test:mcp`
- `npm run test:asset-presentation`
- `npm run test:single-parent`
- `npm run check:mcp-bundle`
- `npm run test:dev-server`
- Fresh browser/dev：安全与恶意 SVG 都是透明、无文件卡的直接 `<img>`；保持 8:3 与 3:2 比例，清理 script/事件/foreignObject/SMIL/外链且保留 viewBox/gradient，执行标记全 false；左右 Handle、More、Open、Replace、legacy kind/MIME 重载均通过，console errors/warnings 0/0。
- `npm run test:widget-runtime`：最终 production composed widget sanitizer、SMIL、data URL 与 passive `<img>` contract 通过。
- Dev `/api/asset` 200/206 返回 `image/svg+xml`、`nosniff` 与 sandbox CSP；真实 native host 不在本轮证据内。

## 后续风险

不得为了 SVG 预览扩宽 native CSP 或改用 object/embed/iframe/inline markup。真实 native host 未纳入本轮证据。未来增加引用协议或 renderer 时必须扩展恶意 fixture；原始 SVG 保持不改写，仅 preview 派生数据被清洗。
