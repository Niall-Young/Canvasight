---
schema_version: 1
report_id: solution-cmd-zoom-boundary-flash
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: null
created_at: 2026-07-13T03:11:13Z
updated_at: 2026-07-13T03:11:13Z
depends_on:
  - issue-cmd-zoom-boundary-flash
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
  - design.md
verification_status: passed
verification_evidence:
  - typecheck and production build passed
  - composed widget smoke passed queued-recovery, 200 percent, 20 percent, and persisted viewport gates
  - MCP smoke and plugin validation passed
---

# Cmd 缩放边界闪屏解决方案

## Root Cause

Viewport recovery 在两帧等待后使用旧闭包 viewport；用户缩放只在 move end 写入 Page，导致恢复任务可能用旧比例覆盖正在进行的交互。

## 解决方案

- 用用户交互 generation 和 active lock 取消过期恢复任务。
- 恢复时从 Zustand 读取最新 Page viewport 和节点。
- 程序化恢复抑制 viewport 持久化，用户 move end 先保存夹紧后的最终 viewport 再释放交互锁。
- 统一 20% 到 200% 边界，并使工具栏缩放同样使旧恢复任务失效。
- 增加真实 production widget 边界与竞态回归覆盖。

## 处理结果

实现与自动化验证完成；真实 Codex native host 仍需重启后验收。

## 修改文件

- `plugins/canvasight/src/App.tsx`
- `plugins/canvasight/tests/widget-runtime-smoke.mjs`
- `design.md`

## 验证方式

- `npm run typecheck`
- `npm run build`
- `npm run test:widget-runtime`
- `npm run test:mcp`
- plugin validator

## 后续风险

未取得重启后 native widget 的真人 Cmd 手势证据，因此对应 issue 保持 assigned/unverified。
