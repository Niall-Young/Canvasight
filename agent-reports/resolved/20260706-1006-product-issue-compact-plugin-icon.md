---
status: resolved
report_type: issue
owner: development-agent
created_by: product-agent
priority: medium
created_at: 2026-07-06 10:06
updated_at: 2026-07-06 10:06
related_files:
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/assets/icon.png
  - plugins/canvasight/assets/logo.png
solution_report: agent-reports/resolved/20260706-1006-development-solution-compact-plugin-icon.md
---

# 已安装列表图标仍显示默认图标

## TL;DR

Canvasight 详情页已使用新 logo，但插件页顶部“已安装”列表仍显示默认灰色图标，说明 compact icon surface 没有稳定读取新品牌图。

## 发现者

Product Agent

## 提交 Agent

Product Agent

## 建议交接 Agent

Development Agent

## 问题描述

用户截图显示 Canvasight 在 Codex 插件页顶部“已安装”横向列表中仍是默认 paperclip 图标，而详情页已经改成新图。该问题会让插件入口和详情页品牌不一致。

## 现象

- 详情页 logo 已更新。
- “已安装”横向列表图标没有更新。

## 复现方式

1. 安装 `canvasight@canvasight-local`。
2. 打开 Codex 插件页。
3. 查看顶部“已安装”横向插件列表中的 Canvasight 图标。
4. 点击进入详情页，对比详情页 logo。

## 影响范围

影响 Codex 插件页入口图标，不影响 Canvasight 网页 favicon、MCP tools 或运行逻辑。

## 证据

- 用户截图中红框标注的已安装列表图标仍为灰色默认图标。
- 本地 cache 已存在 `interface.logo`，详情页可以读取新图。

## 初步归因

上轮把 `logo` 和 `composerIcon` 都指向同一张 `assets/logo.png`，但已安装列表更像 compact surface，应使用独立的小图资产作为 `composerIcon`，避免列表组件使用默认 fallback 或缓存旧图。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 已安装列表读取的是 `logo` 还是 `composerIcon`？
- 是否需要独立 compact icon 资产？
- 是否需要版本 bump 和重新安装来刷新 Codex plugin cache？

## 相关文件

- plugins/canvasight/.codex-plugin/plugin.json
- plugins/canvasight/assets/icon.png
- plugins/canvasight/assets/logo.png
- plugins/canvasight/package.json
- plugins/canvasight/mcp/server.mjs

## 期望结果

详情页和已安装横向列表都使用 Canvasight 新品牌图；列表不再显示默认灰色图标。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

resolved

## 处理结果

已修复

## 修改文件

- plugins/canvasight/.codex-plugin/plugin.json
- plugins/canvasight/assets/icon.png
- plugins/canvasight/package.json
- plugins/canvasight/package-lock.json
- plugins/canvasight/mcp/server.mjs
- plugins/canvasight/tests/mcp-smoke.mjs
- README.md

## 验证方式

- `npm run test:mcp`
- `npm run build`
- plugin validate
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`

## 后续风险

Codex 插件页前端可能有内存缓存；如果当前窗口仍显示旧图，需要 reload 或重启 Codex app 后再看。
