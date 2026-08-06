---
schema_version: 1
report_id: solution-task-code-background-canvas
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: low
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-08-06T03:30:00Z
updated_at: 2026-08-06T03:30:00Z
depends_on:
  - issue-task-code-block-dark-canvas-background
related_issue: agent-reports/assigned/issue-task-code-block-dark-canvas-background.md
related_files:
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-text-smoke.mjs
verification_status: passed
verification_evidence:
  - npm run test:rich-text
  - npm run typecheck
  - git diff --check
---

# Task 代码背景统一为画布 token

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-task-code-block-dark-canvas-background.md`

## Root Cause

Task rich-text CSS 让 `.task-body-content code` 和 `.task-body-content pre` 共用 input surface。在暗色主题中 input 为 `#1C1C1C`，canvas 为 `#0A0A0A`，因此 inline/fenced code 都没有呈现用户要求的画布背景语义。

## 调研过程

- 审计 light/dark/translucent token，确认 `--color-background-canvas` 已覆盖所有主题变体，无需新增硬编码颜色。
- 审计 `.task-body-content code`、`pre`、`pre code` 与 `.task-body-raw-markdown.is-inline` 的选择器层级。
- 先加入 focused CSS contract，确认旧实现因两个 selector 使用 input token 而失败。

## 可选方案

- 新增暗色硬编码 override：会绕过 translucent/theme token，不采用。
- 只改 fenced block：不满足用户补充的 inline code 范围，不采用。
- 两个 code surface 直接使用现有 canvas token：最小且主题安全，采用。

## 推荐方案

将 `.task-body-content code` 与 `.task-body-content pre` 的背景改为 `var(--color-background-canvas)`。保留更具体的 `.task-body-content pre code { background: transparent; }`，避免 fenced block 内产生双层背景。保留 `.task-body-raw-markdown.is-inline` 的 input token，因为它是 unsupported raw syntax 占位而非 inline code。

## 实施步骤

1. 修改两个背景声明，不新增 token 或 theme-specific override。
2. 为 inline code、fenced block、nested pre code transparency 和 raw Markdown inline 边界加入 focused assertions。
3. 运行 rich-text smoke、typecheck 与 diff check。

## 风险与回滚

Canvas token 在 light/dark/translucent 下都会生效，因此亮色 code surface 也从 input `#F5F5F5` 收敛到 canvas `#F2F2F2`；这是统一 token 语义的预期结果。回滚只需恢复两个 background 声明。

## 处理结果

已完成；inline/fenced code 共用 canvas background，nested `pre code` 与 raw Markdown inline 边界保持。

## 修改文件

- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-text-smoke.mjs`

## 验证方式

- `npm run test:rich-text`：PASS（先红后绿）。
- `npm run typecheck`：PASS。
- `git diff --check`：PASS。

## 后续风险

- 前端 CSS 变化需要 Main Thread 重建 Web `dist`。
- MCP runtime 与版本合同未变化，不需要重建 MCP bundle 或提升 `SERVER_VERSION`。
