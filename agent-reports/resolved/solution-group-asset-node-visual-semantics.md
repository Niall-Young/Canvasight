---
schema_version: 1
report_id: solution-group-asset-node-visual-semantics
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: medium
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-08-05T02:35:00Z
updated_at: 2026-08-05T02:35:00Z
depends_on:
  - issue-group-asset-node-visual-semantics
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/components/GroupNode.tsx
  - plugins/canvasight/src/styles/app.css
  - README.md
  - design.md
verification_status: passed
verification_evidence:
  - Canvasight 0.5.1 local automation matrix passed
  - Final Playwright Group and Asset workflow passed
---

# Group 与 Asset Node 视觉语义优化方案

## 负责 Agent

Development Agent 负责实现，Design Agent 与 Test Supervisor Agent 负责最终审查，Main Thread 负责集成。

## 对应问题

`agent-reports/assigned/issue-group-asset-node-visual-semantics.md`

## Root Cause

Group 仍继承 XYFlow 默认节点边框，并把折叠放在标题左侧、适应内容藏入菜单；Asset 则复用了 Task 的可编辑与可运行结构。两类对象因此没有分别表达“轻量语义容器”和“受管文件对象”的领域语义。

## 推荐方案

让 Group 只用内部容器表现范围，移除默认黑色外壳，并把适应内容、折叠/展开固定到右侧工具栏。把 Asset 收敛为 360px 的文件/图片卡片，保留左右连接点和打开能力，把更换、分类与删除集中到更多菜单，不再暴露文字编辑、复制或 Run。

## 实施步骤

1. 清除 Group 外层默认边框并重排工具栏，折叠态保留禁用的适应内容入口。
2. 重构 Asset 文件卡、图片预览、类型标记、元数据和连接点显隐。
3. 增加显式文件替换并保证节点 ID、位置、Group、角色和 Edge 不变。
4. 阻止 Asset 从节点或全局入口启动 Run，并从任务抽屉排除 Asset。
5. 同步中英文文案、README、`design.md`、0.5.1 版本和构建分发快照。

## 风险与回滚

替换文件不会删除旧受管文件，回滚 UI 不会破坏现有 `.scatter` v2 数据。若需回退，可恢复本次 UI、文案与分发快照；持久化字段和 Graph Writer 合同未改变。

## 处理结果

本地实现与浏览器可见流程已完成。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/components/GroupNode.tsx`
- `plugins/canvasight/src/components/RightDrawer.tsx`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/styles/app.css`
- `README.md`、`design.md`
- 0.5.1 版本字段、MCP bundle 与 `dist/`

## 验证方式

- 通过 build、MCP bundle、MCP、并发、Widget runtime、插件分发、Markdown、release 和 plugin validation。
- 通过最终 Playwright fixture 的 Group 展开/折叠、菜单、Fit、Asset 卡片、分类、左右 handle、文件替换保持和控制台检查。
- Design Agent 最终 PASS；Test Supervisor Agent 对实现和 supporting evidence 判定 PASS。

## 后续风险

真实 Codex native-host 仍为 `unverified`，由 `agent-reports/assigned/issue-group-asset-node-visual-semantics.md` 保持 blocked 并交由 Test Supervisor Agent 跟进。
