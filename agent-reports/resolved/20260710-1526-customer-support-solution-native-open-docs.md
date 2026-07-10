---
status: resolved
report_type: solution
owner: Customer Support Agent
created_by: Customer Support Agent
priority: high
created_at: 2026-07-10 15:26
updated_at: 2026-07-10 15:26
related_issue: agent-reports/assigned/20260710-1506-development-issue-native-open-attempt-refactor.md
related_files:
  - README.md
---

# Native open 重构用户文档同步

## 负责 Agent

Customer Support Agent

## 对应问题

`agent-reports/assigned/20260710-1506-development-issue-native-open-attempt-refactor.md`

## Root Cause

README 仍描述旧的 session-level ready 合同：`open_canvasight` 只记录 `sessionId`，`await_canvasight_widget_ready` 未要求 `openAttemptId` 和 `threadId`，且 `reactMounted` 被描述为主要成功证据。这会让用户或 Codex 在 hidden/inline renderer、未 hydration 项目或不可见画布的情况下提前报告成功。

## 调研过程

更新前核对了 `AGENTS.md`、`design.md`、`plugins/canvasight/package.json`、`plugins/canvasight/mcp/server.mjs` 和全部 `plugins/canvasight/skills/*/SKILL.md`。当前 MCP 实现返回 provisional `opening`、`openAttemptId` 和 `sessionId`，ready wait 要求 attempt/session/thread 三重绑定，结果包含 fullscreen instance、React、项目 hydration、canvas rendered/visible 和尺寸证据；设计基线同时要求单调启动状态机与持久失败面板。

## 可选方案

- 方案 A：只修改 MCP Tools 参数表，保留其余用户流程描述。
- 方案 B：同步修改中英文基础用法、原生 widget 合同、MCP Tools、真实宿主验收和 FAQ。

## 推荐方案

采用方案 B。native open 重构同时改变成功语义、失败恢复和 Run 资格，仅修改参数表会继续留下提前报喜和错误 fallback 认知。

## 实施步骤

1. 在中英文基础用法中记录 `openAttemptId`、`sessionId` 和 `threadId` 的连续两步调用。
2. 明确 verified ready 只来自同一 fullscreen instance 的完整证据，hidden/inline/browser renderer 仅用于诊断。
3. 记录单调启动阶段、持久失败面板、重连/新任务重开/复制诊断和 fullscreen-only Run。
4. 将真实宿主验收补齐为可见画布、真实控件、同任务 Run，以及重复/乱序事件后不回退 Connecting。

## 风险与回滚

README 描述的是当前重构目标合同；若 runtime 字段在集成完成前再次改名，需要同步调整文档。回滚时仅回退本报告关联的 README 改动，不影响 runtime、tests、skills 或版本文件。

## 处理结果

README 的中英文 native open、ready、failure、fallback、Run 和验收说明已与 OpenAttempt/fullscreen instance 合同同步。本报告只确认文档完成，不代表真实 Codex native-host 验收通过，也不关闭仍为 assigned/unverified 的 critical runtime issue。

## 修改文件

- `README.md`
- `agent-reports/resolved/20260710-1526-customer-support-solution-native-open-docs.md`

## 验证方式

- 对照 `plugins/canvasight/mcp/server.mjs` 的 tool schema 和 ready result 字段复核中英文参数、返回证据与 Run 限制。
- 对照 `design.md` 复核启动状态机、失败 UI 和重复事件不回退要求。
- 检查中文与 English 章节结构和语义一致。

## 后续风险

真实宿主五项门槛尚由主线程和 Test Supervisor Agent 验证。若未安装准确新版本、重启 Codex Desktop 并在新任务完成 fullscreen ready、完整画布、真实控件、同任务 Run 和重复事件不回退检查，critical issue 必须继续保持 assigned/unverified。
