---
schema_version: 1
report_id: issue-historical-widget-polling-storm
report_type: issue
status: resolved
owner: Test Supervisor Agent
created_by: Main Thread
priority: critical
version: 4
agent_id: /root/test_supervisor_agent
thread_id: 019f6458-f4a1-77a0-b865-0a07f94c0f09
created_at: 2026-07-15T06:11:35Z
updated_at: 2026-07-15T07:18:13Z
depends_on: []
related_files:
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/mcp/server.source.mjs
  - plugins/canvasight/tests/mcp-smoke.mjs
  - plugins/canvasight/tests/widget-runtime-smoke.mjs
verification_status: passed
verification_evidence:
  - Automated 0.4.21 gates passed: typecheck, build, MCP bundle, MCP smoke, four-widget runtime smoke, dev-server smoke, plugin distribution, release verify, and plugin validator.
  - MCP smoke verifies unique project+thread ownership, eligibility gates, standby revision isolation, explicit and 10-second expired takeover, stale release safety, session-close cleanup, and held-open stdio transport behavior.
  - Widget runtime verifies four mounted production widgets, one owner with 5-7 polls per 30.5 seconds, max in-flight 1, A-to-B focused takeover, teardown silence, and workspace autoResize disabled.
  - canvasight@canvasight-local 0.4.21 is installed and enabled; the installed cache contains SERVER_VERSION 0.4.21 and the revision-poll route.
  - After a full Codex Desktop restart, native open passed status=ready, verified=true, fullscreen, React/project/canvas evidence, and a visible 679x793 canvas in the original task.
  - Three further native reopen cycles all reached verified fullscreen ready; unfocused historical Widgets produced no growing periodic traffic and the runtime remained bounded to one Canvasight stdio shim plus one daemon.
  - During 67 seconds of focused canvas switching and node movement, one approximately five-second periodic chain was observed; its first 30 seconds contained six periodic requests, while other API calls correlated with user edits and saves.
  - The user exercised meaningful canvas controls and node release Run delivered its Markdown back to the same Codex task through the native host bridge.
solution_report: agent-reports/resolved/solution-historical-widget-polling-storm.md
---

# 历史 Canvasight Widget 重开后触发轮询风暴

## 问题

Codex Desktop 重开包含多个历史 Canvasight Widget 的 task 时，每个挂载实例都会启动独立的 1500ms revision 轮询，造成 `canvasight_widget_api` 请求率随历史实例数增长、activity 状态抖动、ResizeObserver 错误和宿主持有的 MCP stdio 进程积累。

## 目标

- daemon 按 project + Codex task 维护唯一 revision-poll owner。
- 只有 ready、focused、visible、measurable fullscreen Widget 可以轮询。
- 非 owner 不产生周期性 revision 请求，owner 使用非重叠的 5 秒串行轮询。
- blur、hidden、零尺寸、非 fullscreen、pagehide 和 resource teardown 停止轮询并释放 lease。
- 保持 stdio 生命周期由 host transport、stdin EOF、stdout/EPIPE 和信号负责，不增加危险 idle 自退。

## 验收

- 四个历史生产 Widget 同时挂载时，30 秒内最多一个周期性 poller，总请求率不随实例数增长。
- owner 可从 A 切换到 B，异常 owner 的 lease 在 10 秒内失效。
- teardown 后零后续请求；workspace 不启用自动 ResizeObserver，inline framework questions 保持原行为。
- 自动化门禁通过，并在精确安装 0.4.21、重启 Codex Desktop 后完成真实 native ready/control/Run 与原问题 task 复测。

## 发布边界

本 issue 当前只交付 0.4.21 修复候选和验收证据，不发布 Release、不移动 `stable`、不关闭 GitHub issue。若无流量 stdio shim 仍由 Codex host 持有，则拆分 host lifecycle follow-up。

## 处理结果

0.4.21 修复候选已完成代码、自动化与原生 Codex Desktop 验收。历史 Widget 的周期请求不再随实例数增长，当前 focused owner 维持约 5 秒串行轮询，画布控制和同 task Run 均通过。GitHub issue 按发布边界保持 open，等待是否发布 0.4.21 的后续决定。
