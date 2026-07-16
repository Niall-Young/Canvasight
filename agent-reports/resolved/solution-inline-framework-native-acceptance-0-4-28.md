---
schema_version: 1
report_id: solution-inline-framework-native-acceptance-0-4-28
report_type: solution
status: resolved
owner: Test Supervisor Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/test_supervisor_agent
thread_id: 019f6b57-ef6d-7ee0-85cd-ad572eb95bec
created_at: 2026-07-16T14:42:48Z
updated_at: 2026-07-16T14:42:48Z
depends_on:
  - issue-inline-framework-questions
related_files:
  - agent-reports/resolved/issue-inline-framework-questions.md
  - agent-reports/QUEUE.md
  - ROSTER.md
verification_status: passed
verification_evidence:
  - Inline confirmation framework-confirmation-9e9d3e65-eaec-4208-8212-86bb4dd36fa6 submitted to the originating task.
  - Fullscreen open open-mrnm36m6-75f9d6e6138c verified widget-284c7d5f-844c-44a3-89b7-a01fd41d304a ready with 758x793 visible canvas.
  - User exercised zoom and the node Run message returned to thread 019f6b57-ef6d-7ee0-85cd-ad572eb95bec without a Connecting regression.
---

# 0.4.28 消息内表单与原生画布宿主验收

## 负责 Agent

Test Supervisor Agent

## 对应问题

`agent-reports/resolved/issue-inline-framework-questions.md`

## Root Cause

0.4.28 的代码、构建、截图和安装快照已通过，但发布门禁还缺少真实 Codex Desktop inline 与 fullscreen 实例证据。

## 调研过程

- 在当前新任务确认 `CODEX_THREAD_ID` 与 exact 0.4.28 插件工具可用。
- 用真实 inline resource 收集并回传 v0.4.28 发布确认。
- 只调用一次 `open_canvasight`，保留 session/open attempt identity 后立即等待实例绑定 ready。
- 在同一 fullscreen 实例操作缩放并执行节点 Run，观察消息返回当前任务且界面未退回 Connecting。

## 推荐方案

接受本轮真实宿主证据，解除 `issue-inline-framework-questions` 发布阻塞；后续发布仍交由 tag workflow 的三平台矩阵控制。

## 实施步骤

1. 提交 inline 确认并验证同任务续跑。
2. 验证 fullscreen instance-bound ready 与非零可见画布。
3. 操作缩放与节点 Run，并观察 late metadata 状态。
4. 回写 issue、queue、roster 与 integration summary。

## 风险与回滚

若 Tag workflow 任一平台失败，不创建正式 Release、不推进 `stable`；若后续需修改候选代码，升至新版本并重跑全部门禁。

## 处理结果

已通过；0.4.28 的真实原生宿主发布阻塞解除。

## 修改文件

- Agent Team 报告、队列与 roster 状态。

## 验证方式

- `ask_canvasight_framework_questions`
- `open_canvasight`
- `await_canvasight_widget_ready`
- 真实缩放控件与节点 Run

## 后续风险

正式发布仍取决于 tag-triggered Windows、macOS、Ubuntu Node 20.19 矩阵和发布后资产校验。
