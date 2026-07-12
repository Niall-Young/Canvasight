---
schema_version: 1
report_id: solution-native-widget-binding-reuse-timeout
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: critical
version: 1
agent_id: /root/development_agent
thread_id: 019f5694-1746-7223-bd64-8cbca20eb319
created_at: 2026-07-12T14:04:28Z
updated_at: 2026-07-12T14:04:28Z
depends_on:
  - 20260710-1506-development-issue-native-open-attempt-refactor
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/main.tsx
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/mcp-smoke.mjs
verification_status: passed
verification_evidence:
  - typecheck, build, widget-runtime, MCP, Markdown, dev-server and plugin validation passed
  - exact plugin version 0.4.4+codex.20260712135359 installed
---

# 原生 Widget 复用绑定与启动超时修复

## Root Cause

Codex 复用已挂载的 Canvasight 容器时会向同一 widget 发送新的 session/open-attempt 结果。旧 bridge 为防止迟到 metadata 覆盖 Ready，会无条件拒绝任何不同身份，导致新 attempt 从未注册实例并在 `starting` 超时，而旧画布仍保持可见。

## 处理结果

- OpenAttempt 新增私有、单调递增的 `bindingIssuedAt`。
- 同 binding 合并元数据但不回退状态；旧 binding 忽略；更新 binding 原子替换运行时身份并发出 rebind。
- React App 按 binding key 重新挂载，旧异步 API、ready 和 error 回执在写状态前校验当前 binding。
- 物理 `widgetInstanceId` 保持不变，所有 session API、ready 和 Run 使用当前 open attempt。
- 默认 ready 等待提升为 30000ms，并返回最后 fullscreen 实例诊断。
- 版本同步提升并重新构建、安装生产插件。

## 验证

- 修复前新增用例稳定失败于 mounted widget 接受更新 binding。
- 修复后 `npm run typecheck`、`npm run build`、`npm run test:widget-runtime`、`npm run test:mcp`、`npm run test:markdown`、`npm run test:dev-server` 与 plugin validator 通过。
- Agent Team 全库 validator 被既有 legacy 报告、旧模板和 QUEUE schema 债务阻断，与本次运行时改动无关。

## 后续风险

真实 Codex Desktop 必须重启后在新任务验证首次 ready、复用窗口二次打开、真实控件、同任务 Run 和迟到 metadata 不回退；完成前关联 critical issue 保持 assigned/unverified。
