---
name: canvasight-troubleshooting
description: Diagnose and fix Canvasight plugin, MCP, native-widget readiness, host bridge, daemon, browser fallback, Run delivery, install, cache, or connection problems. Use when the widget is stuck on Opening Canvasight, await_canvasight_widget_ready returns timeout or failed, React never mounts, a tool falsely appears successful while the canvas is unusable, tools are missing or stale, Transport closed appears, Run does not reach the current task, localhost fails, or Canvasight behavior does not match the installed version.
---

# Canvasight Troubleshooting

Use this skill for Canvasight runtime, install, native readiness, and recovery problems.

## Checklist

1. Reproduce the normal path with the current `CODEX_THREAD_ID`: call `open_canvasight`, capture `sessionId` and `openAttemptId`, then call `await_canvasight_widget_ready` with both values and the same `threadId`.
2. Treat only verified fullscreen readiness with all render evidence true as success. Otherwise record attempt/session/instance identity, display mode, stage, render evidence, error, and timestamp before changing anything.
3. Classify the failing layer: tool discovery/live MCP transport, session/task binding, widget bootstrap/React mount, initial session API, host bridge/Run delivery, browser fallback, daemon, installed cache, or `.scatter` data.
4. If required tools are missing, call `tool_search` for `canvasight open_canvasight await_canvasight_widget_ready render_canvasight_canvas_widget` before declaring them unavailable.
5. If a callable Canvasight tool returns `Transport closed`, report `canvasight_mcp_transport_closed` and inspect `mcp-lifecycle.log` when available. If the plugin version changed while Codex Desktop was running, reload/restart the host before creating and tagging a new task; a new task alone can retain the old app-level registry. Do not substitute browser fallback.
6. If the result reports a missing or mismatched task id, reopen with the active task's exact `CODEX_THREAD_ID`.
7. Verify the installed source and version with `codex plugin list` when behavior is stale. When an install or upgrade changes the resolved version, reload/restart the Codex host, then create a new task and tag the plugin again; creating a task alone is not a sufficient refresh guarantee.
8. Use browser fallback only to isolate browser/daemon behavior. It cannot verify native readiness or native Run delivery.
9. Run the narrowest relevant automated checks, then perform the real native-host acceptance gate. Automated checks remain supporting evidence.

Never say the widget is opened, ready, or fixed based only on tool completion, resource reads, daemon health, browser fallback, build output, or smoke tests.

Read `references/troubleshooting.md` for symptom-specific evidence and recovery.
