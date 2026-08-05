---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-08-05 20:07
updated_at: 2026-08-05 20:07
related_issue: agent-reports/resolved/20260805-1956-issue-remove-asset-role-classification.md
related_files:
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/lib/markdown.ts
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
  - plugins/canvasight/tests/markdown-flow-smoke.mjs
---

# 移除 Asset 分类并以 Edge 承担关系语义

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260805-1956-issue-remove-asset-role-classification.md`

## Root Cause

Asset v2 同时保存了角色字段和 Edge 关系。分类胶囊把兼容字段变成常驻用户控制，并在 Run Markdown 中再次输出，造成视觉冗余，也可能与用户实际连接方向和 Edge label 冲突。

## 调研过程

- 检查 AssetNode，确认分类入口、四项 RadioGroup、可访问名称和更新动作都集中在同一组件。
- 检查 Run Markdown，确认 Asset block 固定追加 `Asset role`。
- 检查 schema、Graph Context 和并发合同，确认直接删除字段会破坏 v2 兼容，因此只移除用户语义层。
- 检查移除后的布局，确认 More 需要独立右上定位，普通文件需要收回 60 px 顶部预留并保留右侧安全区。

## 可选方案

- 方案 A：仅默认隐藏分类，选中时显示。仍保留重复语义，放弃。
- 方案 B：把分类移入 More。仍要求用户管理无意义字段，放弃。
- 方案 C：UI 与 Run Markdown 完全停止暴露分类，底层字段仅兼容读取。采用。

## 推荐方案

采用方案 C。它让 Edge 方向、标签和上下文成为唯一可见关系语义，同时不触发数据迁移或旧文档破坏。

## 实施步骤

1. 删除 AssetRoleOptions、trigger、RadioGroup 与相关样式。
2. 把 article accessible name 收敛为文件名。
3. 把 More 独立固定在右上角，保持 hover/focus/selected/open 行为。
4. 普通文件高度收紧为 112 px，使用 `16px 56px 16px 16px` 内容 padding。
5. 从 Run Markdown 移除 `Asset role`，保留描述、受管文件与 Edge map。
6. 增加 UI absence、More 内容、legacy read 和 Markdown absence 回归门禁。

## 风险与回滚

旧文件仍包含 `role`，Graph Context 也继续返回它；这是刻意的兼容边界。若完全删除字段，必须另行设计 schema 迁移和 AI/MCP 合同，不能在本轮隐式完成。回滚可恢复 UI/Markdown 暴露，但会重新引入重复语义。

## 处理结果

已修复。

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

- Asset/Markdown/Markdown export 自动化、类型检查、生产构建、MCP bundle freshness 和 plugin validation。
- 真实 browser/dev 覆盖分类 absence、More、四种 Asset、媒体、文件安全区、Handle/Edge 与控制台。

## 后续风险

真实 Codex native Widget 未执行 exact-version host acceptance，本轮保持 unverified；browser/dev 验证不能替代该门禁。
