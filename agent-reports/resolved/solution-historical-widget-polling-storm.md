---
schema_version: 1
report_id: solution-historical-widget-polling-storm
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: critical
version: 1
agent_id: /root/development_agent
thread_id: 019f6458-f4a1-77a0-b865-0a07f94c0f09
created_at: 2026-07-15T06:34:36Z
updated_at: 2026-07-15T06:34:36Z
depends_on:
  - issue-historical-widget-polling-storm
related_files:
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Focused MCP and production Widget runtime regressions pass on 0.4.21.
  - Standby responses omit documentRevision and do not maintain periodic revision traffic.
  - Four historical production Widgets keep aggregate polling bounded to one serial owner.
---

# 历史 Widget 轮询风暴修复方案

daemon 现在按规范化 `projectPath + threadId` 保存唯一 10 秒 revision-poll lease，owner 由 session、open attempt 和 Widget instance 三元组标识。只有 ready、fullscreen、React mounted、focused、visible 且有有效尺寸的实例可以用一次 5 秒串行请求同时续约并读取 revision；standby 只做一次延迟重试且不接收 revision。

React workspace 使用完成后再调度的 `setTimeout`，在本地编辑或保存期间不 reload；blur、hidden、零尺寸、非 fullscreen、pagehide、rebind 和 resource teardown 会停止调度并尽力释放。MCP Apps teardown 是有界、幂等且清理监听器，workspace 关闭 ext-apps autoResize，inline framework questions 保持原行为。

stdio shim 没有增加 idle 自退，仍只在 stdin EOF、stdout/EPIPE 或信号边界安全退出。版本、MCP bundle 和 web distribution 已同步为 0.4.21。
