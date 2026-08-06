---
schema_version: 1
report_id: issue-task-code-block-dark-canvas-background
report_type: issue
status: assigned
owner: Test Supervisor Agent
created_by: Main Thread
priority: low
version: 8
agent_id: /root/test_supervisor_agent
thread_id: null
created_at: 2026-08-06T03:28:00Z
updated_at: 2026-08-06T03:42:00Z
depends_on: []
related_files:
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/rich-text-smoke.mjs
verification_status: failed
verification_evidence:
  - 用户新增暗色 inline border 的 npm run test:rich-text、npm run typecheck 与 git diff --check 已通过。
  - Test Supervisor Vite source browser 复测通过：暗色 1px divider、浅色 1px transparent、fenced 单框、nested pre code 无框透明，console 0/0。
  - 真实 native host 继续 unverified。
solution_report: agent-reports/resolved/solution-task-code-background-canvas.md
---

# Task 代码背景与画布不一致

## TL;DR

Task Node 的 inline code 与 fenced code block 使用 input surface；用户要求两者都改用画布背景 token，暗色下与画布一致。

## 发现者

用户

## 提交 Agent

Main Thread

## 建议交接 Agent

Development Agent

## 问题描述

`.task-body-content code` 与 `.task-body-content pre` 当前固定使用 `--color-background-input`。在暗色主题中该 token 与 `--color-background-canvas` 不同，造成两种代码表面比画布明显更亮。

## 现象

- 暗色 `--color-background-input` 为 `#1C1C1C`。
- 暗色 `--color-background-canvas` 为 `#0A0A0A`。
- 用户补充要求 inline code 与 fenced code block 一并改为 canvas background。
- 用户再次补充：暗色 inline code 需要 1px 中性 divider border；浅色不得出现可见边框，fenced pre 已有边框，nested `pre code` 不得双框。

## 复现方式

1. 切换 Canvasight 到暗色主题。
2. 打开包含 fenced code block 的 Task Node。
3. 对比代码块与画布背景。

## 影响范围

Task Node inline code 与 fenced code block 背景及暗色 inline border。`pre code` 继续透明继承且无内框；raw Markdown inline 是 unsupported syntax 占位，不属于 inline code，保持原 surface；其他组件不变。

## 证据

- `app.css` 中 `.task-body-content code` 与 `.task-body-content pre` 使用 `var(--color-background-input)`。
- 同文件暗色 token 将 input 定义为 `#1C1C1C`，canvas 定义为 `#0A0A0A`。

## 初步归因

Rich-text V1 默认让两种 code surface 复用 input token，没有使用 canvas background 语义。

## 交付给哪个 Agent

Development Agent

## 需要回答的问题

- 如何让 inline/fenced code 共用 canvas token，同时保持 `pre code` 透明且不误改 raw Markdown inline？

## 相关文件

- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-text-smoke.mjs`

## 期望结果

Inline code 与 fenced code block 使用 `--color-background-canvas`；inline code 基础态保留透明 1px border，暗色切换到 divider border；fenced block 内部 `code` 继续透明且无 border，raw Markdown inline 继续使用现有 input surface。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录

## 当前状态

assigned：Development、focused 与 Test Supervisor browser 复测均通过；等待用户在真实 Codex native widget 中验收。

## 处理结果

Inline code 使用透明 base border，暗色切换 divider；nested `pre code` 清除 border。Focused 与 Vite source browser 验证均通过，真实 native host 未验证。

## 修改文件

- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/rich-text-smoke.mjs`

## 验证方式

- `npm run test:rich-text`
- `npm run typecheck`
- `git diff --check`

## 后续风险

不得给浅色 inline code 添加可见边框，不得让暗色 override 造成 fenced block 内双框。Web 产物需刷新；真实 native host 仍需用户验收。
