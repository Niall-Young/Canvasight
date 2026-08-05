---
status: resolved
report_type: issue
owner: Development Agent
created_by: Main Thread
priority: high
created_at: 2026-08-05 19:56
updated_at: 2026-08-05 20:07
related_files:
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
  - plugins/canvasight/tests/markdown-smoke.mjs
solution_report: agent-reports/resolved/20260805-2007-development-solution-remove-asset-role-classification.md
---

# 移除 Asset 分类控件与重复 Run 语义

## TL;DR

Asset 左上角“输入/参考/候选/产出”分类下拉与连接关系重复，增加视觉和操作负担；用户要求完全移除该可见控件，并让 Edge 关系承担语义。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

Asset 节点已经通过前后连接和 Edge label 表达依赖/参考关系，节点本身再展示并编辑一套角色分类会重复甚至产生冲突。

## 现象

- 图片、视频和普通文件 Asset 左上角常驻分类胶囊。
- 打开后出现输入、参考、候选、产出四项菜单。
- Run Markdown 还会输出持久化 `Asset role`，可能与用户连接关系表达不同。

## 复现方式

1. 打开任意包含 Asset 的 Canvasight Page。
2. 点击 Asset 左上角分类胶囊。
3. 观察重复的四项分类菜单。

## 影响范围

所有 Asset 节点的画布展示、键盘可达控件和 Run Markdown。

## 证据

- 用户截图中打开的分类菜单。
- 用户明确说明连接前后文已经让 Asset 的用途可被理解。

## 初步归因

Asset v2 初版同时保留了节点角色元数据和 Edge 关系语义，后续视觉简化只把角色从 More 移到常驻下拉，没有消除两套语义的重复。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何移除所有可见/可编辑分类入口而保持旧 v2 文档可读？
- 如何停止 Run Markdown 输出旧角色，同时保持 Edge label 与文件证据完整？
- 移除左侧控件后普通文件 padding 与 More 位置如何收紧？

## 相关文件

- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/src/lib/markdown.ts`
- 相关 tests、README 和 design baseline。

## 期望结果

Asset 节点不显示、不编辑分类；More 仍只保留更换和删除；Run Markdown 不再输出 Asset role；旧文档的 role 字段继续兼容读取且不迁移。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已移除全部可见/可编辑 Asset 分类及 Run Markdown 角色行；persisted role 仅保留作 v2 兼容，真实 browser/dev 验收通过。

## 修改文件

- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/src/lib/markdown.ts`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/tests/markdown-flow-smoke.mjs`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/*`
- `README.md`
- `design.md`
- `design-qa.md`
- `AGENTS.md`

## 验证方式

- `npm run test:asset-presentation`
- `npm run test:markdown`
- `npm run test:markdown-export`
- `npm run typecheck`
- `npm run build`
- `npm run check:mcp-bundle`
- plugin validation
- 真实浏览器覆盖四种 Asset、More、媒体、文件布局、Handle/Edge 和控制台。

## 后续风险

真实 Codex native Widget 未执行 exact-version host acceptance；本轮 browser/dev 证据不能替代该门禁。不得删除或迁移 v2 的 persisted role 字段，以免破坏旧文档和 MCP/AI 合同。
