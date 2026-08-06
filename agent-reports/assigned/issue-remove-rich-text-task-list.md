---
schema_version: 1
report_id: issue-remove-rich-text-task-list
status: assigned
report_type: issue
owner: Test Supervisor Agent
created_by: Main Thread
priority: medium
version: 5
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-08-06T03:04:00Z
updated_at: 2026-08-06T03:18:00Z
depends_on: []
related_files:
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/richTextExtensions.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-text-smoke.mjs
  - design.md
  - README.md
verification_status: unverified
verification_evidence:
  - npm run test:rich-text、npm run typecheck、dependency lock dry-run 与 git diff --check 通过。
  - Test Supervisor browser 复测通过：legacy marker 有可见空格且不生成 checkbox，普通列表与独立 checkbox/drawer 未回归。
solution_report: agent-reports/resolved/solution-remove-rich-text-task-list.md
---

# 移除 Task 正文富文本复选框

## TL;DR

Task Node 正文当前把 Markdown 任务列表渲染成复选框；用户明确不需要这类控件，要求从富文本能力和样式总览中移除。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

正文中的 `- [ ]` / `- [x]` 会成为交互式 checkbox，增加不需要的视觉和状态语义。富文本只需保留普通项目列表和编号列表；框架问题卡的多选 checkbox、设置控件与右侧任务列表抽屉不属于本问题。

## 现象

- 样式总览节点显示“已完成任务/未完成任务”复选框。
- Task editor 注册 Tiptap TaskList/TaskItem，并存在专属 checkbox CSS。
- README 与 design baseline 将任务列表列为支持格式。

## 复现方式

1. 在 Task Node 正文输入 `- [ ] 未完成` 或 `- [x] 已完成`。
2. 完成 Markdown 输入转换或重新载入节点。
3. 正文显示可勾选 checkbox。

## 影响范围

Task Node 富文本解析、序列化、legacy Markdown 显示、样式、依赖、自动化、双语文档和当前富文本样式总览节点。

## 证据

- 用户截图显示正文任务项占据大块空间，并明确要求不再保留。
- `TaskNode` 与 rich-text smoke 均注册 TaskList/TaskItem。

## 初步归因

V1 富文本初始能力包含 Tiptap TaskList/TaskItem，但当前产品方向不再需要正文中的可交互任务状态。直接删除扩展还会使 Tiptap Markdown parser 静默丢弃 legacy `[ ]` / `[x]` marker，因此需要在普通 ListItem 上做 source-preserving 兼容。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 移除扩展后 legacy task-list Markdown 如何保持无数据丢失且不渲染 checkbox？
- 如何证明普通列表与框架问题卡 checkbox 不受影响？

## 相关文件

- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-text-smoke.mjs`
- `README.md`
- `design.md`

## 期望结果

Task 正文不再生成 checkbox；普通无序/有序/嵌套列表继续工作，legacy task-list Markdown 保持可读且不丢失，非正文多选控件保持原行为，样式总览更新为 14 类。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

assigned：源码、自动化和浏览器/合成 production widget 验证已通过，等待用户在真实 Codex native widget 中自行验收。

## 处理结果

Task 正文已移除交互式 task-list schema、依赖和专属 CSS；legacy marker 作为普通列表文字原样往返，focused、browser 与合成 production widget 验证均通过。真实 Codex native host 尚未验收，因此问题保持 assigned/unverified。

## 修改文件

- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/lib/richTextExtensions.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-text-smoke.mjs`
- `README.md`（Main Thread）
- `design.md`（Main Thread）

## 验证方式

- `npm run test:rich-text`
- `npm run typecheck`
- `npm ci --dry-run --ignore-scripts`
- `git diff --check`
- production widget/browser-visible Task Node 回归。

## 后续风险

不得误删 Framework Questions 多选 checkbox、UI Checkbox primitive 或右侧任务列表 drawer。仍缺少安装精确交付快照后的真实 Codex native widget 验收；用户已明确要自行验收。
