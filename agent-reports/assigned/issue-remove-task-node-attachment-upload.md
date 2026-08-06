---
schema_version: 1
report_id: issue-remove-task-node-attachment-upload
report_type: issue
status: assigned
owner: Test Supervisor Agent
created_by: Main Thread
priority: medium
version: 2
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-08-06T05:48:26Z
updated_at: 2026-08-06T06:13:39Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/src/lib/translations.ts
  - plugins/canvasight/tests
  - design.md
  - README.md
verification_status: failed
verification_evidence:
  - 用户明确要求移除 Task 节点内上传附件功能及底部加号入口。
  - Focused tests、typecheck、Markdown/export/concurrency、production build、composed widget 与 Chromium browser QA 通过。
  - 真实 Codex native widget 尚未验收，因此保持 assigned/failed，不以 browser 证据关闭。
solution_report: agent-reports/resolved/solution-remove-task-node-attachment-upload.md
---

# 移除 Task 节点内上传附件功能

## TL;DR

Task 节点不再提供附件上传入口，也不再接收投放或粘贴文件；新文件统一创建为画布级 Asset Node。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

Task 正文底部仍存在“＋”附件入口，与文件应作为可连接 Asset Node 的当前产品方向冲突。移除新增入口时必须保留旧文档读取兼容，不能静默删除已持久化的历史附件。

## 现象

- Task 正文底部显示附件加号按钮。
- 文件拖到或粘贴到 Task 时仍会生成内联附件。

## 复现方式

1. 打开任意 Task 节点。
2. 查看正文底部，或把文件拖放/粘贴到该 Task。
3. 观察可创建内联附件。

## 影响范围

Task 节点 UI、画布文件投放/粘贴路由、历史附件兼容、Run/Markdown 输出与用户文档。

## 证据

- 用户截图标出 Task 正文底部加号并明确要求砍掉该功能。
- 当前 Task 动作仍暴露选择、上传、移除和提升附件能力，画布 drop/paste 会优先写入目标 Task。

## 初步归因

Asset Node 已成为正式文件对象，但旧的 Task 内联附件创建路径尚未收敛。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何移除所有新建 Task 附件入口，同时保持 v1/v2 历史附件可读、可运行且不丢数据？
- 文件落在 Task 上或粘贴时应如何稳定转为 Asset Node？

## 相关文件

- 见 frontmatter `related_files`。

## 期望结果

Task 节点没有附件加号或上传入口；文件拖放、粘贴和画布级文件选择统一创建 Asset Node。已有历史内联附件保持兼容，不因打开或保存被删除。

## Closure Criteria

- [x] Task 节点附件加号和文件选择入口移除
- [x] Task drop/paste 不再创建新内联附件
- [x] 新文件统一创建 Asset Node
- [x] 历史附件数据读取、Run/Markdown 和保存兼容
- [x] focused tests、typecheck、build 与 browser QA 通过
- [x] README 与 design.md 同步中英产品合同
- [ ] 真实 Codex native widget 验收状态明确通过

## 当前状态

assigned：实现与 browser QA 已通过；交给 Test Supervisor Agent 等待真实 Codex native widget 验收。

## 处理结果

Task 新增附件入口及写入链路已删除；Task drop/paste 统一创建 Asset，历史附件保持兼容。

## 修改文件

- `AGENTS.md`
- `README.md`
- `design.md`
- `plugins/canvasight/package.json`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/components/ui/canvas-node.tsx`
- `plugins/canvasight/src/lib/translations.ts`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/task-attachment-entry-smoke.mjs`
- production Web artifacts

## 验证方式

- `npm run test:task-attachments`
- `npm run typecheck`
- `npm run build`
- `npm run test:markdown`
- `npm run test:markdown-export`
- `npm run test:rich-text`
- `npm run test:concurrency`
- `npm run test:widget-runtime`
- browser-visible Task/drop/paste QA

## 后续风险

真实 native host 尚未验收；历史附件创建能力仍存在于旧文档/模板数据兼容层，但 UI、drop、paste 与 Store 不再提供新增入口。
