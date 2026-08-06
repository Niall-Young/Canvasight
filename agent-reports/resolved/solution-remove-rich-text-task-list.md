---
schema_version: 1
report_id: solution-remove-rich-text-task-list
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: medium
version: 3
agent_id: /root/development_agent
thread_id: null
created_at: 2026-08-06T03:13:00Z
updated_at: 2026-08-06T03:15:00Z
depends_on:
  - issue-remove-rich-text-task-list
related_issue: agent-reports/assigned/issue-remove-rich-text-task-list.md
related_files:
  - plugins/canvasight/package.json
  - plugins/canvasight/package-lock.json
  - plugins/canvasight/src/components/TaskNode.tsx
  - plugins/canvasight/src/lib/richTextExtensions.ts
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-text-smoke.mjs
verification_status: passed
verification_evidence:
  - npm run test:rich-text
  - npm run typecheck
  - npm ci --dry-run --ignore-scripts
  - git diff --check
  - Test Supervisor production browser regression
---

# 移除 Task 正文富文本复选框

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-remove-rich-text-task-list.md`

## Root Cause

Task Node 与 rich-text smoke 显式注册 Tiptap TaskList/TaskItem，并由专属 CSS 把 Markdown task marker 渲染为交互式 checkbox。仅删除扩展时，Tiptap 的底层 Markdown lexer 仍会识别 task item，但普通 ListItem parser 会丢弃 checkbox token，导致 legacy `[ ]` / `[x]` marker 静默消失。

## 调研过程

- 审计 Task editor extensions、依赖清单、lockfile、taskList/taskItem CSS、rich-text smoke、README 和 `design.md`。
- 用不含 TaskList/TaskItem 的最小编辑器复现 marker 丢失：`- [x] 已完成` 被序列化为 `- 已完成`。
- 验证 FrameworkQuestionsCard、UI Checkbox primitive 与 RightDrawer Task list 使用独立组件/语义，不依赖 Tiptap task-list 扩展。
- Browser 初测发现 marker DOM 后缺少可见空格，修正 renderer 并加入 DOM text/HTML 合同断言。

## 可选方案

- 方案 A：直接删除扩展，接受 legacy marker 丢失。数据破坏，不采用。
- 方案 B：将 marker 转义成普通 Markdown 文本。不会显示 checkbox，但会改写持久字符串，不优先。
- 方案 C：普通 ListItem + 被动 legacy marker inline node。既不产生 checkbox，又能原样序列化 marker，采用。

## 推荐方案

移除 TaskList/TaskItem 的 imports、extension registration、direct dependencies、lock entries 与专属 CSS。扩展普通 ListItem 的 Markdown parsing：遇到 legacy task token 时，将 marker 转为只显示文本的 `legacyTaskMarker` inline atom；DOM 输出 `[ ] ` / `[x] `，Markdown renderer 输出原 marker 与分隔空格。普通 bullet/ordered/nested lists 保持原实现。

## 实施步骤

1. 删除 Tiptap TaskList/TaskItem 注册与依赖。
2. 删除 `.task-body-content` 下 taskList/taskItem checkbox 专属 CSS。
3. 加入 source-preserving legacy marker/ListItem 兼容扩展。
4. 扩展 rich-text smoke，覆盖 marker 原样往返、无 task schema/checkbox、DOM 可见空格、nested/ordered list，以及非正文 checkbox/drawer 保留合同。

## 风险与回滚

兼容 marker 是非交互 inline atom，可整体删除但不能像普通字符一样逐字修改；这是避免重新引入 checkbox 语义并保持原 Markdown 的最小折衷。回滚时可恢复 TaskList/TaskItem 注册、依赖和 CSS，但会重新带回用户明确拒绝的交互式 checkbox。

## 处理结果

Development 实现和 focused verification 已完成；Test Supervisor production browser 复测确认 legacy marker 间距、无正文 checkbox、普通列表及独立 checkbox/drawer 均通过。

## 修改文件

- `plugins/canvasight/package.json`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/src/components/TaskNode.tsx`
- `plugins/canvasight/src/lib/richTextExtensions.ts`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-text-smoke.mjs`

## 验证方式

- `npm run test:rich-text`：PASS；包含红到绿 marker 丢失回归、DOM 间距、普通/嵌套/编号列表和保留边界。
- `npm run typecheck`：PASS。
- `npm ci --dry-run --ignore-scripts`：PASS，仅计划移除两个 task-list package。
- `git diff --check`：PASS。
- Test Supervisor production browser regression：PASS；`[x] 已完成` / `[ ] 未完成` 可见间距正确，正文无 checkbox，普通列表与 Framework Questions/Task drawer 未回归。

## 后续风险

- Frontend runtime 变化需要 Main Thread 安全重建 Web `dist`；MCP runtime 未变化，不需要 `SERVER_VERSION` 或 MCP bundle bump。
- 真实 native host 不在本 Development 报告的验收范围；本轮 production browser regression 已通过。
