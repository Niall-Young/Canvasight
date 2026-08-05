---
status: resolved
report_type: solution
owner: Development Agent
created_by: Main Thread
priority: medium
created_at: 2026-08-05 13:41
updated_at: 2026-08-05 13:41
related_issue: agent-reports/resolved/20260805-1337-issue-asset-control-placement-hover.md
related_files:
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/components/ui/action-menu-item.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
---

# Asset 分类右侧选中标记与实心 More 方案

## 负责 Agent

Development Agent 实现，Design Agent 审查视觉规格，Test Supervisor Agent 独立浏览器验收，Main Thread 集成。

## 对应问题

`agent-reports/resolved/20260805-1337-issue-asset-control-placement-hover.md`

## Root Cause

分类选中状态把 check 当成普通前置图标，导致选中行 label 偏移。Asset More 的专用背景规则又被后置的全局 plain IconButton hover/focus 规则覆盖，视频画面因此透出。

## 调研过程

对照用户截图复现分类行坐标和视频 More computed background；检查 Radix RadioItem、ActionMenuItem 插槽与 CSS 级联顺序，确认问题不涉及数据或菜单状态。

## 可选方案

- 方案 A：仅用 Asset CSS 重排现有前置图标。
- 方案 B：为 ActionMenuItem 增加可选 trailing icon 槽，并用 Asset 限定样式覆盖 More 的完整可见状态。

## 推荐方案

采用方案 B。它让 label 左缘保持一致、未选行预留相同右侧槽，同时不改变其他菜单的前置操作图标；More 样式仍限定在 Asset，使用主题 token 兼容深色模式。

## 实施步骤

1. 为 ActionMenuItem 增加可选 `trailingIcon` 槽。
2. Asset 分类四项统一保留 16px 右侧槽，只有当前项显示 check。
3. Asset More 的 base、hover、focus-visible 与 open 统一使用不透明 surface，并移除 backdrop filter。
4. 扩展 Asset presentation 合同测试并重建 Web 分发快照。

## 风险与回滚

新增 trailing slot 为可选 API，未使用它的菜单 DOM 与样式不变。回滚四个源码/测试文件及 Web snapshot 即可，不涉及持久化数据。

## 处理结果

已修复并通过自动化与浏览器验证。

## 修改文件

- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/components/ui/action-menu-item.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/dist/`

## 验证方式

- build、Asset presentation、MCP bundle 检查通过。
- Playwright 确认四项 label 坐标一致、check 位于右侧、视频 More 四种可见状态背景完全不透明、控制台零错误/警告。

## 后续风险

真实 Codex native-host 未在本轮重启验收，保持 `unverified`；本轮只确认开发浏览器 surface。
