---
status: resolved
report_type: solution
owner: main-thread
created_by: main-thread
priority: critical
created_at: 2026-07-10 15:37
updated_at: 2026-07-10 15:37
related_issue: agent-reports/assigned/20260710-1506-development-issue-native-open-attempt-refactor.md
related_files:
  - plugins/canvasight/mcp/server.mjs
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
---

# OpenAttempt 与 fullscreen 实例绑定重构

## 负责 Agent

main-thread（Development Agent v2 完成部分 MCP 结构后因线程限制中断，由主线程接管集成）

## 对应问题

`agent-reports/assigned/20260710-1506-development-issue-native-open-attempt-refactor.md`

## Root Cause

旧协议把 ready 保存在 session 上，没有区分某次打开、renderer 实例和 presentation；widget 的重复 metadata 事件还可以把已挂载界面写回 Connecting，因此 daemon/session ready 与用户可见的 fullscreen 画布并不等价。

## 推荐方案

一次性替换 session 级 ready：公开入口保持不变，内部以 `OpenAttempt + widgetInstanceId` 贯穿 API、ready、failure 和 Run；只有绑定同一 task 的 fullscreen 实例提交完整 React、bridge、hydration 与 canvas DOM 证据后才能 verified。

## 实施步骤

1. 在 daemon/MCP 中建立 OpenAttempt、实例注册表、单调阶段与严格 await identity。
2. 将 widget bootstrap 重写为单调状态机，增加首帧 React shell、ErrorBoundary、超时和持久失败操作。
3. 将 Run 限制到已验收的 fullscreen instance；browser fallback 继续只作为诊断通道。
4. 收敛 tool descriptor/result metadata，并同步 README、design、skills、AGENTS 与版本。
5. 添加事件乱序、实例隔离和真实生产 bundle 组合测试。

## 风险与回滚

回滚点是本轮代码与 `0.3.0` 版本；不需要迁移 `.scatter`。真实 Codex Desktop 尚未在重启后的新任务完成五项验收，因此 critical issue 继续 assigned/unverified。

## 处理结果

实现完成并通过自动化与组合宿主验证；不标记真实 native-host 已修复。

## 修改文件

- MCP/runtime：`plugins/canvasight/mcp/server.mjs`
- widget/runtime：`src/App.tsx`、`src/main.tsx`、`src/lib/*`、startup components/styles
- tests：`tests/mcp-smoke.mjs`、`tests/widget-runtime-smoke.mjs`
- docs/contracts：`README.md`、`design.md`、`AGENTS.md`、相关 Canvasight skills
- version/build：manifest、package、lockfile、dist

## 验证方式

- `npm run build`
- `npm run test:widget-runtime`
- `npm run test:mcp`
- `npm run test:markdown`
- `npm run test:dev-server`
- plugin validator、四个 skill quick validators、`git diff --check`
- 已重装 `canvasight@canvasight-local` 版本 `0.3.0+codex.20260710073625`

## 后续风险

必须重启/reload Codex Desktop，再在新任务观察真实 fullscreen ready、操作控件、同任务 Run 和迟到事件不回退；当前任务仍暴露旧版 await schema，不能作为新版本验收宿主。
