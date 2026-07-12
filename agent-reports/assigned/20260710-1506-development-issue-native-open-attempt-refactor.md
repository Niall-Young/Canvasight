---
status: assigned
report_type: issue
owner: Development Agent
created_by: main-thread
priority: critical
created_at: 2026-07-10 15:06
updated_at: 2026-07-12 22:04
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/App.tsx
solution_report: agent-reports/resolved/solution-native-widget-binding-reuse-timeout.md
agent_id: /root/development_agent
---

# 原生打开链路按可见实例重构

## TL;DR

当前 session 级 ready 可由错误 renderer 满足，且 widget 启动状态允许从 Ready 回退到 Connecting，导致右侧画布不可用时仍被误报成功；本轮重构为 OpenAttempt、实例绑定和单调启动状态。

## 发现者

main-thread

## 提交 Agent

main-thread

## 建议交接 Agent

Development Agent

## 问题描述

真实 Codex 任务中，`await_canvasight_widget_ready` 返回 `status=ready, reactMounted=true`，右侧 fullscreen widget 却持续显示 `Connecting Canvasight session...` 且无完整画布。旧实现只在 session 上保存一个 ready 回执，没有 open attempt、renderer identity、display mode、项目 hydration 或 canvas DOM 证据。

## 现象

- session `session-mrekxfk1-538cbb8a` 在 2026-07-10 14:53:36 报告 ready。
- 同一时刻用户可见的右侧 widget 仍为空白 Connecting。
- 重复 `toolresult` / `openai:set_globals` 可无条件把 shell 状态写回 Connecting。

## 复现方式

1. 新建 Codex 任务并通过 `@Canvasight 打开画布` 调用 `open_canvasight`。
2. 调用 `await_canvasight_widget_ready` 并观察其快速返回 ready。
3. 对比右侧 fullscreen widget，画布仍可能不可见且 Connecting 不消失。

## 影响范围

- 原生打开、ready 验收、Run 来源认证和用户成功文案。
- widget bootstrap、MCP app-only API proxy、技能说明、测试、README 与设计基线。
- 不改变画布编辑器、Zustand、`.scatter` schema 或 browser fallback 的诊断定位。

## 证据

- `~/.canvasight/mcp-lifecycle.log`：open 后完成 12 次 `canvasight_widget_api`，ready await 约 33ms 完成。
- Codex Desktop 日志确认同一任务 API 调用成功，但截图可见实例仍 Connecting。
- `server.mjs` 仅保存 `session.widgetReady`；`canvasightApi.ts` 硬编码 `reactMounted:true`；`widgetBridge.ts` 对每次 metadata 都重置 Connecting。

## 初步归因

ready 身份和可见 presentation 未绑定，加上非单调的前端状态机，使隐藏/inline renderer 或迟到 metadata 能产生假绿或覆盖真实 UI 状态。

## 交付给哪个 Agent

Development Agent；Design Agent 和 Test Supervisor Agent 分别负责错误/启动 UI 与回归门禁。

## 需要回答的问题

- OpenAttempt 与 widgetInstanceId 如何贯穿 session API、ready、failure 和 Run？
- fullscreen host context、项目 hydration 与真实 canvas DOM 如何成为强制 ready 条件？
- 如何保持公开工具名和 `.scatter` 兼容，同时删除旧 session 级 ready？

## 相关文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/tests/mcp-smoke.mjs`

## 期望结果

一次用户打开动作固定执行 provisional open 与 instance-bound await；只有右侧 fullscreen 实例完成 React、bridge、session、project hydration 和可见 canvas 后才返回 verified ready，任何失败进入可操作 Failed 状态。

## Closure Criteria

- [x] 问题原因明确
- [x] 方案报告已回写
- [x] 修改文件已记录
- [x] 验证方式已记录
- [x] 后续风险已记录
- [ ] 真实 Codex fullscreen 画布、控件与同任务 Run 已验收

## 当前状态

assigned/unverified；实现、自动回归、生产 bundle 组合测试和精确版本重装均完成。当前 Codex task 仍持有旧插件 schema，必须重启宿主后在新 task 完成真实验收，之后才能关闭。

## 处理结果

实现完成，真实宿主未验收

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/main.tsx`
- `plugins/canvasight/src/lib/canvasightApi.ts`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- startup components/styles、tests、README/design/AGENTS/skills、version/dist

## 验证方式

- build、MCP、widget-runtime production composition、Markdown、dev-server、plugin/skill validators 均通过。
- 真实 Codex native-host 五项门槛仍待宿主重启后执行。

## 后续风险

安装版本已提升为 `0.4.4+codex.20260712135359`。自动门禁已覆盖复用容器接收新 binding、旧 binding 忽略、同 binding 单调合并、旧异步结果隔离和 30 秒默认等待；当前 Codex task 在插件升级前已创建，仍不能作为新版本 native-host 证据。

## 2026-07-12 复用容器超时补充

- 真实截图确认 Codex 可复用已挂载的右侧 Canvasight 容器；旧实现把不同 `sessionId/openAttemptId` 的新工具结果误判为迟到事件并丢弃，新 attempt 因此停在 `starting`。
- 新实现为 OpenAttempt 增加私有单调 `bindingIssuedAt`：更新 binding 原子切换并重挂载 App，旧 binding 忽略，相同 binding 只合并元数据且不回退 Ready。
- `await_canvasight_widget_ready` 默认等待改为 30000ms，超时返回最后 fullscreen 实例、阶段和 binding 诊断。
- 精确版本已重新安装；真实宿主的复用窗口、控件、同任务 Run 与迟到事件验收尚未执行，因此 issue 保持 `assigned/unverified`。
