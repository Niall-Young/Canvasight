---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-07-10 19:57
updated_at: 2026-07-10 19:57
related_issue:
related_files:
  - plugins/canvasight/mcp/server.mjs
---

# Desktop Proxy 优先的 Plan/Goal 预检通道

## 负责 Agent

Development Agent

## 对应问题

当前 widget task 的 Plan/Goal 预检由独立 stdio app-server 执行，可能无法读取 Desktop 已加载的当前 task。

## Root Cause

运行时只有 stdio app-server transport，未优先连接 Codex Desktop 的 app-server control socket。

## 推荐方案

控制 socket 存在时用 `codex app-server proxy --sock <socket>`；仅 proxy 进程启动或 initialize 不可用时回退 stdio。任何 thread/mode RPC 错误维持硬失败，确保 Run 不会在 Plan/Goal 未应用时发送。

## 实施步骤

1. 增加 Desktop proxy socket 探测、明确 transport 偏好和 deterministic test 环境变量。
2. 在统一 request sequence 中记录 transport/phase，只对 proxy initialize 失败回退 stdio。
3. 在 `codexNative` 响应中公开成功或失败的 transport 诊断。

## 处理结果

已修复，待集成版本升级、完整 smoke 和真实 native-host 验收。

## 修改文件

- `plugins/canvasight/mcp/server.mjs`
- `agent-reports/QUEUE.md`

## 验证方式

- `npm run typecheck`
- `npm run test:mcp`

## 后续风险

真实 Codex Desktop 原生 widget 验收仍需重启 host 后确认：Plan/Goal 真的在当前 task 生效且 host bridge 将 Markdown 投递到同一 task。
