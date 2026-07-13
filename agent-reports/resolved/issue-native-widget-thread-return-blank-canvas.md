---
schema_version: 1
report_id: issue-native-widget-thread-return-blank-canvas
report_type: issue
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 3
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T02:57:33Z
updated_at: 2026-07-13T03:41:22Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - typecheck, build, widget runtime smoke, MCP smoke, and plugin validation passed
  - composed widget smoke verified two nodes, one edge, saved viewport, zero-size return, no rehydrate, no programmatic save, and ready-state retention
  - exact delivery version 0.4.9+codex.20260713111214 installed and enabled
  - user completed real Codex Desktop native-host acceptance and confirmed the thread-return canvas behavior is correct
solution_report: agent-reports/resolved/solution-native-widget-thread-return-blank-canvas.md
---

# Native Widget 切换 Thread 返回后画布空白

## TL;DR

Codex 隐藏 Canvasight widget 或将其容器降为零尺寸后，返回原 Thread 时 XYFlow 没有重新测量和恢复 viewport，导致项目仍在但节点不可见。

## 现象与复现

1. 在 Thread A 打开已有节点的 Canvasight。
2. 切换到 Thread B。
3. 返回 Thread A，Page 工具栏仍在，但画布节点和连线不可见。

## 影响范围

- Native widget 的 thread 往返、容器隐藏恢复和 viewport 持久化。
- 不改变项目归属、`.scatter` 数据合同或 Run 路由。

## 证据与初步归因

- ReactFlow 只在首次 `onInit` 保存实例，thread 返回没有恢复逻辑。
- bridge 的 `hostcontextchanged` 只更新主题和 display mode。
- App 没有 `ResizeObserver`、`visibilitychange` 或同 binding 恢复路径。
- 截图保留 Page 和工具栏但缩放为 20%，更符合 viewport/尺寸失效而非数据丢失。

## 期望结果

- 同 binding 返回时保留原 Page、节点、边和合法 viewport；旧文档或无效 viewport 自动 fit。
- 新 binding 继续完整 hydrate；失败进入现有 Failed 面板，绝不静默空白或覆盖 `.scatter`。
- 自动化覆盖零尺寸恢复、多次往返、旧 metadata 和新 binding；真实 native host 完成 Thread A/B 往返与 Run 路由验收。

## Closure Criteria

- [x] viewport 在 move end 保存且不污染节点撤销历史
- [x] 0 尺寸恢复、host context 和 visibility fallback 可触发合并恢复
- [x] 自动化、构建、插件和 Agent Team 验证结果已记录
- [x] 真实 native-host 证据已通过，或 issue 保持 assigned/unverified

## 当前状态

resolved

## 处理结果

- 已实现 Page viewport 保存、同 binding 恢复、0→正尺寸观察、host context/visibility 兼容信号和不可见节点自动 fit。
- Test Supervisor 阻断的程序化 viewport 覆盖与 ready→failed 状态矛盾已修正。
- 用户已完成真实 Codex Desktop 验收并确认 Thread 返回画布行为正确，本 issue 正式关闭。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- 四处插件版本文件与构建产物

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:widget-runtime`
- `npm run test:mcp`
- plugin validator

## 后续风险

- 无已知后续风险；用户已确认真实 native widget 表现正常。
- Agent Team validator 仍被协议启用前的 legacy 根目录报告、旧模板和既有 QUEUE 全局格式阻断，不是本轮新增报告错误。
