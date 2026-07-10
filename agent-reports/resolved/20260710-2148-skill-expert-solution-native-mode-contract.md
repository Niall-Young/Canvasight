---
status: resolved
report_type: solution
owner: Skill Expert Agent
created_by: Skill Expert Agent
priority: high
created_at: 2026-07-10 21:48
updated_at: 2026-07-10 21:48
related_issue: user-reported-native-plan-mode-false-positive
related_files:
  - plugins/canvasight/skills/canvasight-run/SKILL.md
  - plugins/canvasight/skills/canvasight-run/references/run-output-contract.md
  - agent-reports/QUEUE.md
---

# Canvasight Run 原生模式契约修正

## 负责 Agent

Skill Expert Agent

## 对应问题

用户现场确认：Canvasight 能投递 Run Markdown，但当前 Codex task 实际没有进入 Plan mode。

## Root Cause

Run skill 的参考合同仍把独立 app-server 的 Plan/Goal 请求和 follow-up 到达当作模式已切换的证据。当前 widget host 仅暴露 follow-up message，不提供可调用且可确认的原生模式控制 API。

## 调研过程

核对当前 `canvasight-run` 技能、Run 合同、Development 的 `20260710-2146` 解决报告与 Queue。运行时代码已在 `sendMessage` 前阻断 Plan/Goal；技能说明仍保留过期的 `applied_plan` / `applied_goal` 和独立 app-server 表述。

## 推荐方案

将技能合同收紧为：Chat 的 follow-up Promise 仅证明投递；没有同一 widget instance 与 task 的宿主模式切换确认时，Plan/Goal 必须返回明确阻断错误且绝不发送。未来只在宿主公开该 API 和确认回执后再扩展合同。

## 实施步骤

1. 明确 Chat follow-up 与 Plan/Goal 模式切换是两项不同能力。
2. 删除将 app-server 输出或 `structuredContent.codexNative.status` 当作 Plan/Goal 证据的说明。
3. 写明当前阻断错误码和未来宿主确认的最低条件，并更新 Queue。

## 风险与回滚

该变化不会修改运行时代码；它避免 Skill 指示未来任务绕过严格门控。若宿主提供实例绑定的模式 API，应以真实 Desktop-host 证据更新此合同并恢复对应 Run 路径。

## 处理结果

已修正 Canvasight Run 技能与参考合同，使其与现有严格阻断实现一致。

## 修改文件

- `plugins/canvasight/skills/canvasight-run/SKILL.md`
- `plugins/canvasight/skills/canvasight-run/references/run-output-contract.md`
- `agent-reports/QUEUE.md`
- `agent-reports/resolved/20260710-2148-skill-expert-solution-native-mode-contract.md`

## 验证方式

- 手工核对：Plan/Goal 段落不再宣称 follow-up、独立 app-server 或结构化状态能证明原生模式已切换。
- `quick_validate.py plugins/canvasight/skills/canvasight-run`。

## 后续风险

当前 Desktop host 不具备 Plan/Goal 控制回执，故这两种 Run 仍是明确阻断。需要主线程在未来宿主 API 出现后，以真实 native widget 验证模式切换和同 task 投递。
