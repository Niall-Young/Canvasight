---
schema_version: 1
report_id: solution-remove-task-node-attachment-upload
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: medium
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-08-06T06:13:39Z
updated_at: 2026-08-06T06:13:39Z
depends_on:
  - issue-remove-task-node-attachment-upload
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/components/ui/canvas-node.tsx
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/task-attachment-entry-smoke.mjs
verification_status: passed
verification_evidence:
  - npm run test:task-attachments
  - npm run typecheck
  - npm run test:markdown、test:markdown-export、test:rich-text、test:concurrency
  - Chromium browser Task/drop/paste/Group/legacy fixture/geometry matrix
---

# 移除 Task 节点附件新增入口并保留历史兼容

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-remove-task-node-attachment-upload.md`

## Root Cause

Asset Node 已成为文件的一等对象，但 Task 仍保留旧 footer、选择器和 `appendAttachments` 写入链路，drop/paste 也会按目标节点改变文件对象类型。

## 调研过程

- 追踪 Task footer、RuntimeActions、Store action、画布 drop/paste 与富文本文件事件。
- 建立 focused smoke，先证明所有新建入口存在，再驱动删除。
- Browser QA 发现 Group 内固定左置会覆盖已有成员，以及 attachment-only 历史 Task 的 Run 被 UI 禁用；均完成修复和复测。

## 可选方案

- 只隐藏加号：不可取，drop/paste 和不可见选择器仍能创建内联附件。
- 删除所有 `attachments` 数据：不可取，会破坏旧项目、Run、Markdown、导出和模板。
- 删除新增链路并保留 legacy 读取/迁移：采用。

## 推荐方案

Task UI 和 Store 不再暴露附件创建动作。文件选择、Task/canvas/Group drop 及文件/图片 paste 统一调用 Asset 创建；Task 命中时在邻近空位创建 Asset，同组 Task 继承 `parentId`，但不自动创建 Edge。历史 attachment 数组仍可显示、移除、提升、运行、导出和往返保存。

## 实施步骤

1. 删除 Task footer 加号、节点级 file input 和相关 actions/translations/styles。
2. 删除 `appendAttachments` Store action，保留 remove 与持久化兼容。
3. 将 Task drop/paste 路由到 Asset 创建，并用碰撞检测选择邻近位置。
4. 保持 TipTap 对文件事件的内容阻断，避免正文插入媒体。
5. 让正文为空但有历史附件的 Task 仍可运行。
6. 添加 focused smoke 与 browser fixture 回归。

## 风险与回滚

回滚文件路由会重新引入 inline attachment；不得通过清空 legacy 数组恢复。碰撞检测使用 Asset 最大高度保守避让，可能扩展 Group，但不会覆盖已有成员或改变现有 Edge。

## 处理结果

Task 附件新增功能已移除；所有用户文件导入路径创建 Asset，历史附件保持数据兼容。

## 修改文件

- 见 frontmatter `related_files`。

## 验证方式

- Focused、类型、Markdown/export/rich-text/concurrency 测试
- Production build 与 composed widget smoke
- Chromium browser UI、drop/paste、Group、legacy fixture、geometry 与 console matrix

## 后续风险

真实 Codex native widget 仍需用户验收；Agent/模板层的 legacy attachment metadata 继续作为只读兼容合同存在。
