---
schema_version: 1
report_id: solution-native-widget-thread-return-blank-canvas
report_type: solution
status: resolved
owner: Development Agent
created_by: Main Thread
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T03:41:22Z
updated_at: 2026-07-13T03:41:22Z
depends_on:
  - issue-native-widget-thread-return-blank-canvas
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/src/store/scatterStore.ts
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - automated typecheck, build, widget runtime smoke, MCP smoke, and plugin validation passed
  - user completed real Codex Desktop native-host acceptance
---

# Native Widget Thread 返回画布恢复方案

## Root Cause

Codex 切换 Thread 时会隐藏 native widget 或将容器降为零尺寸；XYFlow 返回后没有重新测量和恢复 viewport，导致节点数据仍在但不可见。

## 推荐方案与实施

- Page viewport 在用户移动结束时独立持久化，不进入节点撤销历史。
- 用 `ResizeObserver`、host context 和 `visibilitychange` 检测同 binding 恢复，等待连续两帧正尺寸。
- 优先恢复保存 viewport；非法或节点全部不可见时自动 fit；程序化恢复不会覆盖保存值。
- 用户 viewport 交互使排队中的旧恢复任务失效，避免缩放边界闪回。
- 同 binding 不重新 hydrate，新 binding 保留完整启动流程；恢复失败显示持久诊断面板。

## 处理结果

实现、自动化验证、精确版本安装和用户真实 native-host 验收均已完成。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/src/lib/widgetBridge.ts`
- `plugins/canvasight/src/store/scatterStore.ts`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- 插件版本与 `dist` 构建产物

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:widget-runtime`
- `npm run test:mcp`
- plugin validator
- 用户真实 Codex Desktop Thread 往返验收

## 后续风险

- 无已知风险。
