---
name: canvasight-open
description: "Open, reopen, attach, and verify Canvasight's Codex native widget, or explicitly open a browser fallback. Use when the user asks to start Canvasight, open the Canvasight workspace, 打开画布, 打开 Canvasight, 恢复最近项目, attach the current Codex task, or verify whether a native canvas actually became ready."
---

# Canvasight Open

Use this skill to open Canvasight through MCP and verify the real native widget runtime.

## Native Open Workflow

1. Read the active task's `CODEX_THREAD_ID` from the shell. Require a non-empty value and pass that exact value as `threadId`.
2. If the tools are not callable, use `tool_search` for `canvasight open_canvasight await_canvasight_widget_ready render_canvasight_canvas_widget`.
3. Call `open_canvasight` for normal use. Use `render_canvasight_canvas_widget` only as its compatibility alias.
4. Read `sessionId` from the open result. Tool completion means only that a widget session was prepared; it is not evidence that the canvas rendered.
5. Immediately call `await_canvasight_widget_ready` with the returned `sessionId` and the same `threadId`.
6. Report the canvas as opened or ready only when the result has both `status: "ready"` and `reactMounted: true`.
7. For `status: "timeout"`, `status: "failed"`, or any result without `reactMounted: true`, report the returned `stage` and `error`, keep the native open result `unverified`, and route diagnosis through `canvasight-troubleshooting`.

Do not replace step 5 with resource reads, daemon health, build output, MCP smoke tests, browser fallback, or visual assumptions. Do not loop on ready timeouts or silently open localhost.

## Recovery And Fallback

- When a native tool returns `Transport closed`, report `canvasight_mcp_transport_closed` and check the installed plugin state. If the plugin version changed while Codex Desktop was running, reload/restart the Codex host before creating and tagging a new task; a new task alone can retain the old app-level registry. Browser fallback is not a native recovery.
- When neither the native open tool nor `await_canvasight_widget_ready` is available after `tool_search`, report the missing capability. After an install or upgrade, require a Codex host reload/restart followed by a newly created and newly tagged task. Do not claim readiness.
- Use `list_canvasight_recent_projects` and `open_canvasight_recent_project` to reopen a recent project, then apply the same `await_canvasight_widget_ready(sessionId, threadId)` gate.
- Use `open_canvasight_browser_fallback` only when the user explicitly requests fallback or when diagnosing the browser surface. It queues Run payloads for `await_canvasight_run` after an explicit thread claim and never satisfies native-widget readiness.
- Call `close_canvasight` only for a specific session that is no longer needed. It does not stop the project daemon.

After verified readiness, treat the project as active Canvasight context. Route later structured canvas-writing requests to `canvasight-graph-writer`; keep small direct commands and Run payloads on their normal paths.

Read `references/open-workflow.md` for the detailed contract and failure handling.
