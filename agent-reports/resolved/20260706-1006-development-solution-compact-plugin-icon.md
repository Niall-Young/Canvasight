---
status: resolved
report_type: solution
owner: development-agent
created_by: development-agent
priority: medium
created_at: 2026-07-06 10:06
updated_at: 2026-07-06 10:06
related_issue: agent-reports/resolved/20260706-1006-product-issue-compact-plugin-icon.md
related_files:
  - plugins/canvasight/.codex-plugin/plugin.json
  - plugins/canvasight/assets/icon.png
---

# 独立 Composer Icon 方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260706-1006-product-issue-compact-plugin-icon.md`

## Root Cause

Canvasight 详情页读取 `interface.logo`，而已安装列表/compact 入口更可能读取 `interface.composerIcon`。上轮虽然设置了 `composerIcon`，但它和详情页共用 `assets/logo.png`，缺少专门给 compact surface 使用的小图资产，也没有再次刷新到新版本缓存。

## 调研过程

- 检查已安装 cache，确认 `0.1.13` 的 `plugin.json` 和 `assets/logo.png` 都存在，说明详情页读取路径正确。
- 对比官方插件，确认它们通常把 `logo` 和 `composerIcon` 拆成不同资产，例如 `logo.png`、`icon.png` 或 `composer-icon.png`。
- 检查 plugin creator 规范，确认 `composerIcon` 和 `logo` 是合法字段，未发现 `logoSmall` 或 marketplace entry 图标字段。
- 不修改 marketplace entry，避免引入未规范化字段。

## 可选方案

- 方案 A：只要求用户 reload Codex。可能解决内存缓存，但没有改善 compact icon 资产。
- 方案 B：新增独立 `assets/icon.png`，让 `composerIcon` 指向小图；版本 bump 并重装插件。更符合官方插件资产分层。
- 方案 C：往 `.agents/plugins/marketplace.json` 塞 icon 字段。不符合当前 plugin-creator 规范，不推荐。

## 推荐方案

采用方案 B。保留 `logo` 给详情页，新增 `icon.png` 给已安装列表和其他 compact surface。

## 实施步骤

1. 从用户提供的 `Logo.png` 生成 `plugins/canvasight/assets/icon.png`。
2. 更新 `.codex-plugin/plugin.json`：`composerIcon` 指向 `./assets/icon.png`，`logo` 保持 `./assets/logo.png`。
3. 版本从 `0.1.13` 升到 `0.1.14`，同步 package、lock、MCP server 和 smoke test。
4. 重新 build、validate、test、install。

## 风险与回滚

如果 Codex 插件页仍显示旧图，最可能是前端内存缓存，需要 reload/restart Codex app。回滚方式是把 `composerIcon` 改回 `./assets/logo.png` 并 bump 版本，但不建议回滚。

## 处理结果

已修复

## 修改文件

- README.md
- plugins/canvasight/.codex-plugin/plugin.json
- plugins/canvasight/assets/icon.png
- plugins/canvasight/mcp/server.mjs
- plugins/canvasight/package-lock.json
- plugins/canvasight/package.json
- plugins/canvasight/tests/mcp-smoke.mjs

## 验证方式

- `npm run test:mcp`
- `npm run build`
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight`
- `git diff --check`
- `codex plugin add canvasight@canvasight-local`
- `codex plugin list`

## 后续风险

当前验证能确认 manifest、assets 和 plugin cache 正确；实际 Codex UI 当前窗口可能需要 reload 才会刷新已安装列表图标。
